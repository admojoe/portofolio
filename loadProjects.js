// Load and render projects dynamically from JSON
async function loadProjects(filterCategory = null, featuredOnly = false, subcategory = null) {
    try {
        const response = await fetch('projects.json');
        const projects = await response.json();
        
        // Filter by featured if specified (for index.html)
        let filteredProjects = featuredOnly 
            ? projects.filter(p => p.featured === true)
            : projects;

        // Filter by category if specified
        if (filterCategory && filterCategory !== 'all') {
            filteredProjects = filteredProjects.filter(p => p.category === filterCategory);
        }

        // Filter by subcategory if specified
        if (subcategory && subcategory !== 'all') {
            filteredProjects = filteredProjects.filter(p => p.subcategory === subcategory);
        }

        // When showing featured projects on index.html, keep only 2 per subcategory (grouped view)
        if (featuredOnly && !filterCategory && !subcategory) {
            const seenSubcategories = {};
            filteredProjects = filteredProjects.filter(p => {
                if (p.subcategory) {
                    if (!seenSubcategories[p.subcategory]) {
                        seenSubcategories[p.subcategory] = 0;
                    }
                    if (seenSubcategories[p.subcategory] >= 2) {
                        return false; // Skip, already have 2 from this subcategory
                    }
                    seenSubcategories[p.subcategory]++;
                    return true;
                }
                return true; // Keep projects without subcategory (e.g., residential, audio-video)
            });
        }
        
        // Render projects
        await renderProjects(filteredProjects);
        
        // Re-initialize Fancybox after rendering
        if (typeof Fancybox !== 'undefined') {
            Fancybox.bind('[data-fancybox="gallery"]', {});
        }
        
        // Re-initialize AOS after rendering
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }

        // Re-run orientation detection after projects rendered
        if (typeof detectImageOrientation === 'function') {
            setTimeout(() => detectImageOrientation(), 100);
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

async function renderProjects(projects) {
    const container = document.getElementById('projects-container');
    if (!container) return;

    container.innerHTML = '';

    // Cache for fetched srcsets.json per directory
    const srcsetCache = {};

    for (let index = 0; index < projects.length; index++) {
        const project = projects[index];
        const gridClass = project.largeLayout ? 'md:col-span-2' : '';
        const aosDelay = index * 100;

        const projectElement = document.createElement('a');
        projectElement.href = project.imageUrl;
        projectElement.setAttribute('data-fancybox', 'gallery');
        projectElement.setAttribute('data-caption', `${project.title} - ${project.location}`);
        projectElement.className = `group relative h-96 overflow-hidden ${gridClass} block rounded-sm project-item`;
        projectElement.setAttribute('data-category', project.category);
        projectElement.setAttribute('data-aos', 'zoom-in');
        projectElement.setAttribute('data-aos-delay', aosDelay);

        // Try to build <picture> using srcsets.json in the same directory as the image
        let pictureHTML = '';
        try {
            const imgPath = project.imageUrl || '';
            const parts = imgPath.split('/');
            const file = parts.pop();
            const dir = parts.join('/');
            const base = file.replace(/\.[^/.]+$/, '');

            if (!srcsetCache[dir]) {
                // attempt to fetch srcsets.json for this directory
                try {
                    const res = await fetch(`${dir}/srcsets.json`);
                    if (res.ok) {
                        srcsetCache[dir] = await res.json();
                    } else {
                        srcsetCache[dir] = null;
                    }
                } catch (e) {
                    srcsetCache[dir] = null;
                }
            }

            const srcData = srcsetCache[dir] && srcsetCache[dir][base] ? srcsetCache[dir][base] : null;

            if (srcData) {
                // srcData entries contain filenames only (no dir). Prefix with dir for correct URLs.
                const rawWebp = srcData.webp; // e.g. 'commercial-hasnur-1-400w.webp 400w, ...'
                const rawJpg = srcData.jpg;
                const prefix = dir === '' ? '' : dir + '/';
                const webpSrcset = rawWebp.split(',').map(s => {
                    const parts = s.trim().split(/\s+/);
                    return prefix + parts[0] + (parts[1] ? ' ' + parts[1] : '');
                }).join(', ');
                const jpgSrcset = rawJpg.split(',').map(s => {
                    const parts = s.trim().split(/\s+/);
                    return prefix + parts[0] + (parts[1] ? ' ' + parts[1] : '');
                }).join(', ');
                const sizesAttr = '(max-width:600px) 100vw, (max-width:1024px) 50vw, 33vw';

                // img onerror will fallback to original project.imageUrl if generated files 404
                const safeOriginal = project.imageUrl ? project.imageUrl.replace(/"/g, '%22') : '';
                const onerror = `this.onerror=null;this.removeAttribute('srcset');this.src='${safeOriginal}';`;

                pictureHTML = `
                    <picture>
                        <source type="image/webp" srcset="${webpSrcset}" sizes="${sizesAttr}">
                        <img src="${prefix}${base}-800w.jpg" srcset="${jpgSrcset}" sizes="${sizesAttr}" alt="${project.title}" loading="lazy" onerror="${onerror}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                    </picture>
                `;
            } else {
                // fallback: single img
                pictureHTML = `<img src="${project.imageUrl}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="${project.title}">`;
            }
        } catch (err) {
            pictureHTML = `<img src="${project.imageUrl}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="${project.title}">`;
        }

        projectElement.innerHTML = `
            ${pictureHTML}
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                <span class="text-brand-gold text-xs tracking-widest font-bold uppercase translate-y-4 group-hover:translate-y-0 transition-transform duration-500">${project.type}</span>
                <h3 class="text-white font-display text-3xl font-bold translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">${project.title}</h3>
                <p class="text-gray-400 text-sm mt-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">${project.description}</p>
            </div>
        `;

        container.appendChild(projectElement);
    }
}

// Initialize filter buttons
function initializFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const allButton = document.querySelector('[data-filter="all"]');
    
    // Set initial state - ALL button is active by default
    if (allButton) {
        allButton.classList.add('active');
    }
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            // Remove active styling from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));

            // Add active styling to clicked button
            this.classList.add('active');

            // Load filtered projects
            const filterValue = this.getAttribute('data-filter');
            const scopeEl = this.closest('[data-scope]');
            const scope = scopeEl ? scopeEl.dataset.scope : null;

            if (scope) {
                // scope is category (e.g., 'commercial'), filterValue is subcategory (e.g., 'hasnur')
                loadProjects(scope, false, filterValue === 'all' ? null : filterValue);
            } else {
                // No scope, filterValue is category
                loadProjects(filterValue === 'all' ? null : filterValue, false);
            }
        });
    });
}
