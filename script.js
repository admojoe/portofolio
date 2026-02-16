$(document).ready(function () {
  // INIT: Ensure scroll-top button exists and is accessible
  const scrollTopBtn = $('#scroll-top');
  if (scrollTopBtn.length === 0) {
    console.warn('scroll-top button not found in DOM');
    // Early return if button doesn't exist
    return;
  }

  console.log('Script.js loaded successfully, scroll-top button found');

  // 1. Detect Image Orientation and Apply CSS Classes
  window.detectImageOrientation = function() {
    const projectItems = document.querySelectorAll('.project-item');
    projectItems.forEach(item => {
      const img = item.querySelector('img');
      if (!img) return;

      function applyOrientation() {
        if (img.naturalHeight && img.naturalWidth) {
          const ratio = img.naturalHeight / img.naturalWidth;
          if (ratio > 1) {
            item.classList.add('portrait');
            item.classList.remove('landscape');
          } else {
            item.classList.add('landscape');
            item.classList.remove('portrait');
          }
        }
      }

      if (img.complete) {
        applyOrientation();
      } else {
        img.addEventListener('load', applyOrientation);
      }
    });
  };

  $(window).on('load', window.detectImageOrientation);

  const originalLoadProjects = window.loadProjects;
  if (originalLoadProjects) {
    window.loadProjects = async function(...args) {
      await originalLoadProjects.apply(this, args);
      setTimeout(window.detectImageOrientation, 100);
    };
  }

  // 1.5. Native HTML scroll-smooth is enabled (CSS class on <html>)
  // Removed heavy Lenis library - using browser's native scroll behavior

  // 2. Initialize AOS
  AOS.init({
    once: true,
    offset: 50,
    duration: 1000,
  });

  // 2.5. Handle Anchor Links - Direct Scroll
  $(document).on('click', 'a[href^="#"]', function (e) {
    const href = $(this).attr('href');
    if (href === '#') return;
    
    const target = $(href);
    if (target.length) {
      e.preventDefault();
      const targetOffset = target.offset().top;
      
      // Use CSS native smooth scroll instead
      window.scrollTo({
        top: targetOffset - 20,
        behavior: 'smooth'
      });
    }
  });

  // 3. Set Active Nav Link
  function setActiveNavLink() {
    const currentPath = window.location.pathname.toLowerCase();
    const fileName = currentPath.split('/').pop() || 'index.html';
    
    console.log('Current page:', fileName);
    
    // Remove active state from all nav links
    $('.nav-link').removeClass('nav-active');
    $('.nav-link-projects').removeClass('nav-active');
    
    // Reset all underlines
    $('.nav-underline').css('width', '0');
    
    // Check which page we're on and activate the corresponding nav link
    if (fileName === 'about.html') {
      $('a[href="about.html"]').addClass('nav-active');
      $('a[href="about.html"]').find('.nav-underline').stop(true, false).animate({ width: '100%' }, 300);
    } else if (fileName === 'services.html') {
      $('a[href="services.html"]').addClass('nav-active');
      $('a[href="services.html"]').find('.nav-underline').stop(true, false).animate({ width: '100%' }, 300);
    } else if (fileName === 'journal.html') {
      $('a[href="journal.html"]').addClass('nav-active');
      $('a[href="journal.html"]').find('.nav-underline').stop(true, false).animate({ width: '100%' }, 300);
    } else if (fileName.includes('projects') || fileName.includes('commercial') || fileName.includes('residential')) {
      $('.nav-link-projects').addClass('nav-active');
      $('.nav-link-projects').find('.nav-underline').stop(true, false).animate({ width: '100%' }, 300);
    }
  }
  
  // Call on page load and also when navbar is loaded
  $(window).on('load', setActiveNavLink);
  setTimeout(setActiveNavLink, 100);

  // 3. Initialize Navbar & Hamburger (Called from both here and when navbar is loaded)
  window.initializeNavbar = function() {
    const $navbar = $('#navbar');
    const $hamburger = $('#hamburger-btn');
    const $mobileMenu = $('#mobile-menu');
    const $mobileLinks = $('.mobile-link');

    // Fix navbar paths based on folder depth
    // Detect if we're in a subdirectory
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    // Check if current file is in a subdirectory (not in root)
    const isInSubdirectory = pathSegments.length > 1;
    
    if (isInSubdirectory) {
      // We're in a subdirectory, so we need to prepend '../' to relative links
      // Select all navigation links that should point to root pages
      $navbar.find('a[href*=".html"]').each(function() {
        const href = $(this).attr('href');
        // Only fix paths that don't already start with '../' or '/'
        if (href && !href.startsWith('../') && !href.startsWith('/') && !href.startsWith('http') && !href.startsWith('tel:') && !href.startsWith('mailto:')) {
          $(this).attr('href', '../' + href);
        }
      });
    }

    // Remove previous listeners
    $(window).off('resize');
    $(window).off('scroll');
    $hamburger.off('click');
    $mobileLinks.off('click');

    // Resize Handler: Reset Mobile Menu on Desktop Width
    $(window).resize(function () {
      if ($(window).width() >= 1024) {
        // lg breakpoint
        $mobileMenu
          .removeClass('is-open pointer-events-auto')
          .addClass('pointer-events-none');
        $hamburger.removeClass('is-active');
        $('body').removeClass('overflow-hidden');
        updateNavbar(); // Reset navbar style
      }
    });

    // Update Navbar Background Logic
    function updateNavbar() {
      const isMenuOpen = $mobileMenu.hasClass('is-open');

      // If menu is open, make navbar transparent to blend with menu overlay
      if (isMenuOpen) {
        $navbar
          .removeClass(
            'bg-brand-dark/95 backdrop-blur-md py-4'
          )
          .addClass('bg-transparent py-6');
        // Ensure body has 'scrolled' when mobile menu is open so logo can adapt
        $('body').addClass('scrolled');
      }
      // If menu is closed, apply scroll-based styles
      else {
        if ($(window).scrollTop() > 50) {
          $navbar
            .removeClass(
              'py-6 bg-gradient-to-b from-black/80 to-transparent bg-transparent'
            )
            .addClass(
              'bg-brand-dark/95 backdrop-blur-md py-4'
            );
          $('body').addClass('scrolled');
        } else {
          $navbar
            .removeClass(
              'bg-brand-dark/95 backdrop-blur-md py-4 bg-transparent'
            )
            .addClass(
              'py-6 bg-gradient-to-b from-black/80 to-transparent'
            );
          $('body').removeClass('scrolled');
        }
      }
    }

    // Scroll Listener
    $(window).scroll(updateNavbar);

    // Toggle Mobile Menu
    $hamburger.click(function () {
      $(this).toggleClass('is-active');

      if ($mobileMenu.hasClass('is-open')) {
        // Close
        $mobileMenu.removeClass('is-open');
        setTimeout(() => {
          $mobileMenu
            .removeClass('pointer-events-auto')
            .addClass('pointer-events-none');
        }, 500);
        $('body').removeClass('overflow-hidden');
      } else {
        // Open
        $mobileMenu
          .removeClass('pointer-events-none')
          .addClass('pointer-events-auto');
        setTimeout(() => {
          $mobileMenu.addClass('is-open');
        }, 10);
        $('body').addClass('overflow-hidden');
      }

      setTimeout(updateNavbar, 50);
    });

    // Close mobile menu on link click
    $mobileLinks.click(function () {
      $hamburger.removeClass('is-active');
      $mobileMenu.removeClass('is-open');
      setTimeout(() => {
        $mobileMenu
          .removeClass('pointer-events-auto')
          .addClass('pointer-events-none');
      }, 500);
      $('body').removeClass('overflow-hidden');
      setTimeout(updateNavbar, 50);
    });

    // Ensure mobile menu starts hidden interaction-wise
    $mobileMenu.addClass('pointer-events-none');
    updateNavbar(); // Init
  };

  // Call navbar initialization
  window.initializeNavbar();

  // 4. Swiper Initialization
  const serviceSwiper = new Swiper('.serviceSwiper', {
    effect: 'slide',
    grabCursor: true,
    centeredSlides: false,
    slidesPerView: 'auto',
    spaceBetween: 30,
    initialSlide: 0,
    speed: 800,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    },
  });

  const testimonialSwiper = new Swiper('.testimonialSwiper', {
    slidesPerView: 1,
    effect: 'fade',
    fadeEffect: { crossFade: true },
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    pagination: {
      el: '.testimonial-pagination',
      clickable: true,
    },
  });

  // 5. Fancybox Initialization
  Fancybox.bind('[data-fancybox]', {
    // Custom options
    Thumbs: {
      type: 'modern',
    },
    Toolbar: {
      display: {
        left: ['infobar'],
        middle: [],
        right: ['slideshow', 'thumbs', 'close'],
      },
    },
  });

  // 6. Counter Animation
  let counterStarted = false;
  $(window).scroll(function () {
    if ($('.counter').length) {
      const hT = $('.counter').offset().top,
        hH = $('.counter').outerHeight(),
        wH = $(window).height(),
        wS = $(this).scrollTop();

      if (wS > hT + hH - wH && !counterStarted) {
        $('.counter').each(function () {
          $(this)
            .prop('Counter', 0)
            .animate(
              {
                Counter: $(this).data('target'),
              },
              {
                duration: 2000,
                easing: 'swing',
                step: function (now) {
                  $(this).text(Math.ceil(now));
                },
              }
            );
        });
        counterStarted = true;
      }
    }
  });

  // 7. Contact Form with FormSubmit.co (AJAX approach)
  function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault(); // Prevent default submit
      
      const formData = new FormData(this);
      
      // Basic validation
      const user_name = formData.get('user_name') || '';
      const user_email = formData.get('user_email') || '';
      const message = formData.get('message') || '';
      
      if (!user_name.trim() || !user_email.trim() || !message.trim()) {
        Swal.fire({
          title: 'Missing Information',
          text: 'Please fill in all required fields.',
          icon: 'warning',
          background: '#1a1a1a',
          color: '#D0D0D0',
          confirmButtonColor: '#FFFFFF',
        });
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user_email)) {
        Swal.fire({
          title: 'Invalid Email',
          text: 'Please enter a valid email address.',
          icon: 'warning',
          background: '#1a1a1a',
          color: '#D0D0D0',
          confirmButtonColor: '#FFFFFF',
        });
        return;
      }
      
      // Show loading
      Swal.fire({
        title: 'Sending...',
        text: 'Please wait while we send your proposal.',
        icon: 'info',
        background: '#1a1a1a',
        color: '#D0D0D0',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      // Submit via fetch (AJAX) - no redirect
      fetch(this.action, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'  // Important: avoid CORS issues
      }).then(() => {
        // Show success after 2 seconds
        setTimeout(() => {
          Swal.fire({
            title: 'Proposal Sent!',
            html: '<p style="color: #D0D0D0; margin-top: 15px;">We will review your project details and get back to you shortly.</p>',
            icon: 'success',
            background: '#1a1a1a',
            confirmButtonColor: '#FFFFFF',
            confirmButtonText: '<span style="color: #1a1a1a; font-weight: bold;">OK</span>',
            didClose: () => {
              contactForm.reset();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          });
        }, 1000);
      }).catch((error) => {
        console.error('Error:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to send proposal. Please try again.',
          icon: 'error',
          background: '#1a1a1a',
          color: '#D0D0D0',
          confirmButtonColor: '#FFFFFF',
        });
      });
    });
  }
  
  // Setup contact form when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupContactForm);
  } else {
    setupContactForm();
  }

  // 8. Video Reel Modal (Mockup)
  $('#play-reel').click(function () {
    // Responsive width: 95% on mobile, 80% on tablet/desktop
    let modalWidth = window.innerWidth < 768 ? '95%' : '80%';
    
    Swal.fire({
      html: '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://www.youtube.com/embed/WPTFZWWJX1o?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>',
      showConfirmButton: false,
      background: '#000',
      width: modalWidth,
      padding: window.innerWidth < 768 ? '1.5rem' : '2rem',
      showCloseButton: true,
      iconColor: '#fff',
      allowOutsideClick: true,
      allowEscapeKey: true,
      // Ensure the video stops when the modal is closed (any close method)
      didClose: () => {
        try {
          const popup = Swal.getPopup ? Swal.getPopup() : document.querySelector('.swal2-popup');
          if (popup) {
            const iframe = popup.querySelector('iframe');
            if (iframe) iframe.src = '';
          }
        } catch (e) {
          console.error('Error cleaning up video iframe:', e);
        }
      }
    });
  });

  // 9. Cookies Popup Logic
  const cookiePopup = document.getElementById('cookie-popup');
  if (!localStorage.getItem('cookiesAccepted')) {
    setTimeout(() => {
      cookiePopup.classList.remove('hidden', 'translate-y-[150%]');
    }, 3000);
  }

  window.acceptCookies = function () {
    localStorage.setItem('cookiesAccepted', 'true');
    cookiePopup.classList.add('translate-y-[150%]');
    setTimeout(() => cookiePopup.classList.add('hidden'), 500);
  };

  window.closeCookies = function () {
    cookiePopup.classList.add('translate-y-[150%]');
    setTimeout(() => cookiePopup.classList.add('hidden'), 500);
  };

  // 10. Scroll to Top Logic & Back to Home in other pages
  const progressCircle = document.getElementById('scroll-progress-circle');
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  
  // Detect if current page is home page - more reliable method
  const currentUrl = window.location.href;
  const isHomePage = currentUrl.includes('index.html') || 
                     currentUrl.endsWith('/') || 
                     currentUrl.endsWith('mywebsite%20-%20backup/');

  // Function to update button visibility based on scroll position
  function updateScrollButtonState() {
    const scrollTop = $(window).scrollTop();
    const docHeight = $(document).height() - $(window).height();
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) : 0;

    // Show/Hide button
    // On home page: only show after scrolling 300px
    // On other pages: always show (back to home button)
    if (isHomePage) {
      // Home page: scroll-dependent visibility
      if (scrollTop > 300) {
        scrollTopBtn.removeClass('opacity-0 translate-y-10 pointer-events-none');
      } else {
        scrollTopBtn.addClass('opacity-0 translate-y-10 pointer-events-none');
      }
    } else {
      // Non-home pages: always visible
      scrollTopBtn.removeClass('opacity-0 translate-y-10 pointer-events-none');
    }

    // Update progress circle (only on home page)
    const offset = circumference - scrollPercent * circumference;
    if (progressCircle && isHomePage) {
      progressCircle.style.strokeDashoffset = offset;
    }
  }

  // Native scroll event (replaces Lenis)
  $(window).on('scroll', updateScrollButtonState);

  scrollTopBtn.click(function () {
    if (isHomePage) {
      // On index.html: scroll to top
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      // On other pages: navigate to home
      window.location.href = 'index.html';
    }
  });

  // Trigger button state update on page load (with small delay to ensure DOM is ready)
  setTimeout(function() {
    updateScrollButtonState();
  }, 100);

  // Function to force update progress circle
  function forceUpdateProgressCircle() {
    if (isHomePage && progressCircle) {
      const scrollTop = $(window).scrollTop();
      const docHeight = $(document).height() - $(window).height();
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) : 0;
      const offset = circumference - scrollPercent * circumference;
      progressCircle.style.strokeDashoffset = offset;
      console.log('Update progress circle:', {scrollTop, docHeight, scrollPercent: scrollPercent.toFixed(4), offset: offset.toFixed(2)});
    }
  }

  // Browser scroll restoration - wait a bit longer
  window.addEventListener('load', function() {
    console.log('Window load - checking scroll position');
    setTimeout(forceUpdateProgressCircle, 200);
  });

  // MutationObserver to detect when page height changes (images loading, etc)
  const observer = new MutationObserver(function() {
    forceUpdateProgressCircle();
  });
  
  observer.observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
    childList: true
  });

  // Trigger on resize
  window.addEventListener('resize', function() {
    forceUpdateProgressCircle();
  });

  // Final safety check after animations
  setTimeout(function() {
    console.log('Final safety update');
    forceUpdateProgressCircle();
    updateScrollButtonState();
  }, 2000);
});