// 🚀 FUTURISTIC LIBRARY MANAGEMENT SYSTEM - Dynamic JavaScript

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    initializeSearch();
    initializeSorting();
    initializeNotifications();
    initializeCounters();
    initializeThemeEffects();
    enhanceNavigation();
});

// Smooth animations and transitions
function initializeAnimations() {
    // Animate statistics cards on load
    const stats = document.querySelectorAll('.stat');
    stats.forEach((stat, index) => {
        stat.style.opacity = '0';
        stat.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            stat.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            stat.style.opacity = '1';
            stat.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Animate cards on scroll
    const cards = document.querySelectorAll('.card');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });
}

// Enhanced search functionality
function initializeSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(input => {
        let searchTimeout;
        
        input.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const searchTerm = this.value.toLowerCase();
            const table = this.closest('.card').querySelector('table tbody');
            
            if (!table) return;
            
            // Add loading state
            this.classList.add('loading');
            
            searchTimeout = setTimeout(() => {
                filterTableRows(table, searchTerm);
                this.classList.remove('loading');
                
                // Show search results count
                const visibleRows = table.querySelectorAll('tr:not([style*="display: none"])').length;
                showSearchResults(this, visibleRows);
            }, 300);
        });

        // Add search icon animation
        input.addEventListener('focus', function() {
            const icon = this.parentElement.querySelector('.search-icon');
            if (icon) {
                icon.style.color = 'var(--text-primary)';
                icon.style.transform = 'scale(1.1)';
            }
        });

        input.addEventListener('blur', function() {
            const icon = this.parentElement.querySelector('.search-icon');
            if (icon) {
                icon.style.color = 'var(--text-muted)';
                icon.style.transform = 'scale(1)';
            }
        });
    });
}

function filterTableRows(tbody, searchTerm) {
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const shouldShow = text.includes(searchTerm);
        
        row.style.display = shouldShow ? '' : 'none';
        
        // Add fade animation
        if (shouldShow) {
            row.style.opacity = '0';
            setTimeout(() => {
                row.style.transition = 'opacity 0.3s ease';
                row.style.opacity = '1';
            }, 10);
        }
    });
}

function showSearchResults(input, count) {
    // Remove existing results
    const existingResults = input.parentElement.parentElement.querySelector('.search-results');
    if (existingResults) {
        existingResults.remove();
    }

    // Create new results display
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'search-results';
    resultsDiv.innerHTML = `<i class="fas fa-search"></i> Found ${count} results`;
    resultsDiv.style.opacity = '0';
    
    input.parentElement.parentElement.appendChild(resultsDiv);
    
    setTimeout(() => {
        resultsDiv.style.transition = 'opacity 0.3s ease';
        resultsDiv.style.opacity = '1';
    }, 10);
}

// Advanced table sorting
function initializeSorting() {
    const sortableHeaders = document.querySelectorAll('th.sortable');
    
    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const table = this.closest('table');
            const tbody = table.querySelector('tbody');
            const columnIndex = Array.from(this.parentElement.children).indexOf(this);
            const currentSort = this.classList.contains('sort-asc') ? 'desc' : 'asc';
            
            // Remove sort classes from all headers
            sortableHeaders.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
            
            // Add sort class to current header
            this.classList.add(`sort-${currentSort}`);
            
            // Sort rows
            const rows = Array.from(tbody.querySelectorAll('tr'));
            rows.sort((a, b) => {
                const aText = a.children[columnIndex].textContent.trim();
                const bText = b.children[columnIndex].textContent.trim();
                
                // Handle numbers
                const aNum = parseFloat(aText.replace(/[^0-9.-]/g, ''));
                const bNum = parseFloat(bText.replace(/[^0-9.-]/g, ''));
                
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return currentSort === 'asc' ? aNum - bNum : bNum - aNum;
                }
                
                // Handle dates
                const aDate = new Date(aText);
                const bDate = new Date(bText);
                
                if (aDate.toString() !== 'Invalid Date' && bDate.toString() !== 'Invalid Date') {
                    return currentSort === 'asc' ? aDate - bDate : bDate - aDate;
                }
                
                // Handle text
                return currentSort === 'asc' 
                    ? aText.localeCompare(bText)
                    : bText.localeCompare(aText);
            });
            
            // Animate row reordering
            rows.forEach((row, index) => {
                row.style.transform = 'translateX(-100%)';
                row.style.opacity = '0';
                
                setTimeout(() => {
                    tbody.appendChild(row);
                    row.style.transition = 'all 0.3s ease';
                    row.style.transform = 'translateX(0)';
                    row.style.opacity = '1';
                }, index * 50);
            });
        });
    });
}

// Dynamic notifications system
function initializeNotifications() {
    // Create notification container
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        pointer-events: none;
    `;
    document.body.appendChild(notificationContainer);

    // Show welcome notification
    setTimeout(() => {
        showNotification('Welcome to Digital Library! 🚀', 'success');
    }, 1000);
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    notification.style.pointerEvents = 'auto';
    container.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease-in-out forwards';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 500);
    }, 4000);
}

// Animated counters for statistics
function initializeCounters() {
    const statNumbers = document.querySelectorAll('.stat p');
    
    const animateCounter = (element) => {
        const target = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 0;
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const counter = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(counter);
            }
            
            const prefix = element.textContent.includes('$') ? '$' : '';
            const suffix = element.textContent.includes('%') ? '%' : '';
            element.textContent = prefix + Math.floor(current) + suffix;
        }, 16);
    };
    
    // Animate counters when they come into view
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(stat => {
        counterObserver.observe(stat);
    });
}

// Theme and visual effects
function initializeThemeEffects() {
    // Add scroll progress indicator and other effects (removed header parallax)
    window.addEventListener('scroll', () => {
        // Update progress indicator only - removed header parallax effect
        updateScrollProgress();
    });
    
    // Add scroll progress indicator
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: var(--accent-gradient);
        z-index: 10001;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);
    
    function updateScrollProgress() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    }
    
    // Add mouse trail effect
    let mouseTrail = [];
    document.addEventListener('mousemove', (e) => {
        mouseTrail.push({ x: e.clientX, y: e.clientY, time: Date.now() });
        
        // Keep only recent positions
        mouseTrail = mouseTrail.filter(pos => Date.now() - pos.time < 500);
        
        // Create trail effect on interactive elements
        const target = e.target.closest('.btn, .stat, .card');
        if (target && !target.classList.contains('has-trail')) {
            createMouseTrail(e.clientX, e.clientY);
        }
    });
    
    function createMouseTrail(x, y) {
        const trail = document.createElement('div');
        trail.style.cssText = `
            position: fixed;
            width: 6px;
            height: 6px;
            background: var(--accent-gradient);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            left: ${x - 3}px;
            top: ${y - 3}px;
            opacity: 0.8;
            animation: fadeTrail 0.5s ease-out forwards;
        `;
        
        document.body.appendChild(trail);
        
        setTimeout(() => {
            if (trail.parentElement) {
                trail.parentElement.removeChild(trail);
            }
        }, 500);
    }
    
    // Add CSS for trail animation
    const trailStyle = document.createElement('style');
    trailStyle.textContent = `
        @keyframes fadeTrail {
            0% { opacity: 0.8; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.3); }
        }
        
        @keyframes slideOutRight {
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(trailStyle);
}

// Enhanced button interactions
document.addEventListener('click', function(e) {
    const button = e.target.closest('.btn, button');
    if (button) {
        // Ripple effect
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentElement) {
                ripple.parentElement.removeChild(ripple);
            }
        }, 600);
    }
});

// Add ripple animation CSS
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// Real-time clock for dashboard
function updateClock() {
    const clockElement = document.getElementById('lastRefresh');
    if (clockElement) {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString();
    }
}

setInterval(updateClock, 1000);

// Form validation enhancements
document.querySelectorAll('form').forEach(form => {
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearErrors);
    });
    
    form.addEventListener('submit', function(e) {
        if (!validateForm(this)) {
            e.preventDefault();
            showNotification('Please correct the errors before submitting', 'error');
        }
    });
});

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    // Remove existing error states
    field.classList.remove('error');
    
    // Basic validation
    if (field.hasAttribute('required') && !value) {
        field.classList.add('error');
        return false;
    }
    
    // Email validation
    if (field.type === 'email' && value && !isValidEmail(value)) {
        field.classList.add('error');
        return false;
    }
    
    return true;
}

function clearErrors(e) {
    e.target.classList.remove('error');
}

function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField({ target: input })) {
            isValid = false;
        }
    });
    
    return isValid;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Enhanced navigation functionality
function enhanceNavigation() {
    // Add scroll effect to header
    const header = document.querySelector('header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add scrolled class when scrolling
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Highlight active navigation item
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const linkPath = new URL(link.href).pathname;
        
        // Handle root path and dashboard
        if ((currentPath === '/' || currentPath === '/dashboard') && (linkPath === '/' || linkPath === '/dashboard')) {
            link.classList.add('active');
        } else if (currentPath.startsWith(linkPath) && linkPath !== '/') {
            link.classList.add('active');
        }
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const headerHeight = header.offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add loading animation to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Don't add loading for external links or same page links
            if (this.hostname !== window.location.hostname || this.getAttribute('href').startsWith('#')) {
                return;
            }
            
            // Add subtle loading effect
            this.style.opacity = '0.7';
            this.style.transform = 'scale(0.95)';
            
            // Reset after a short delay (in case navigation is fast)
            setTimeout(() => {
                this.style.opacity = '';
                this.style.transform = '';
            }, 200);
        });
    });
}

// Export functions for global use
window.librarySystem = {
    showNotification,
    validateForm,
    initializeAnimations,
    initializeSearch
};