/**
 * @copyright Copyright (c) 2025 alfonsrv <alfonsrv@protonmail.com>
 *
 * @license AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

(function() {
    'use strict';

    /**
     * Format a date to YYYY-MM-DD HH:MM
     * 
     * @param {Date|string|number} date - The date to format
     * @return {string} The formatted date
     */
    function formatDate(date) {
        try {
            // Handle different date formats
            if (typeof date === 'string') {
                // Skip if it's already in our format
                if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(date)) {
                    return date;
                }
                date = new Date(date);
            } else if (typeof date === 'number') {
                // If it's a timestamp in seconds (10 digits), convert to milliseconds
                if (date.toString().length === 10) {
                    date = new Date(date * 1000);
                } else {
                    date = new Date(date);
                }
            }
            
            // Check if date is valid without logging errors
            if (!(date instanceof Date) || isNaN(date.getTime())) {
                // Silently return current date instead of logging errors
                date = new Date();
            }
            
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        } catch (e) {
            // Silently handle any errors and return current date
            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        }
    }

    /**
     * Replace all timestamps with absolute format
     */
    function replaceTimestamps() {
        console.log('Absolute Timestamps: Scanning and replacing timestamps...');
        
        // Target the specific elements in the DOM
        const timestampElements = document.querySelectorAll('.nc-datetime, span[data-timestamp], td.files-list__row-mtime span');
        
        // Process each element
        timestampElements.forEach(element => {
            // Skip if the element already has our format
            if (element.textContent.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
                return;
            }
            
            // Get the timestamp
            let timestamp = element.getAttribute('data-timestamp');
            
            // If no timestamp attribute, try to parse from the title or text content
            if (!timestamp) {
                if (element.hasAttribute('title')) {
                    timestamp = element.getAttribute('title');
                } else {
                    // For relative times, use current time
                    const text = element.textContent.trim();
                    if (text.includes('ago') || text.includes('minute') || text.includes('hour') || 
                        text.includes('day') || text.includes('week') || text.includes('month')) {
                        timestamp = new Date();
                    }
                }
            }
            
            // Format and update the element
            const formattedDate = formatDate(timestamp);
            element.textContent = formattedDate;
            if (element.hasAttribute('title')) {
                element.setAttribute('title', formattedDate);
            }
            
            // Mark as processed
            element.classList.add('absolute-timestamp-processed');
            
            // Store the original timestamp for future reference
            if (timestamp && !element.hasAttribute('data-original-timestamp')) {
                element.setAttribute('data-original-timestamp', timestamp);
            }
            
            // Set up observer for this element if not already done
            if (!element._absoluteTimestampPatched) {
                const observer = new MutationObserver(() => {
                    // Only update if it's a relative timestamp
                    const text = element.textContent.trim();
                    if (!text.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/) && 
                        (text.includes('ago') || text.includes('minute') || 
                         text.includes('hour') || text.includes('day') || 
                         text.includes('week') || text.includes('month'))) {
                        
                        // Get timestamp and update
                        const ts = element.getAttribute('data-original-timestamp') || 
                                   element.getAttribute('data-timestamp') || 
                                   new Date();
                        element.textContent = formatDate(ts);
                    }
                });
                
                observer.observe(element, { characterData: true, childList: true, subtree: true });
                element._absoluteTimestampPatched = true;
            }
        });
    }
    
    /**
     * Override the Nextcloud date formatting functions
     */
    function overrideNextcloudDateFunctions() {
        // Try to override OC.Util.formatDate if it exists
        if (window.OC && window.OC.Util && typeof window.OC.Util.formatDate === 'function') {
            window.OC.Util.formatDate = function(timestamp) {
                return formatDate(timestamp);
            };
        }
        
        // Try to override moment.js if it's being used
        if (window.moment && typeof window.moment === 'function') {
            window.moment.fn.format = function() {
                return formatDate(this._d);
            };
        }
        
        // Try to override the Vue filter if it exists
        if (window.Vue && window.Vue.filter) {
            window.Vue.filter('formatDate', formatDate);
        }
    }
    
    /**
     * Set up a MutationObserver to watch for new timestamp elements
     */
    function setupObserver() {
        // Create a MutationObserver to watch for changes in the DOM
        const observer = new MutationObserver(() => {
            // Check for new timestamps periodically but not on every mutation
            clearTimeout(window._timestampDebounce);
            window._timestampDebounce = setTimeout(replaceTimestamps, 200);
        });
        
        // Start observing the document
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * Listen for specific Nextcloud events that might trigger timestamp updates
     */
    function listenForNextcloudEvents() {
        // Listen for file list updates
        if (window.OCA && window.OCA.Files) {
            // Files app events
            const eventsToListen = [
                'changeDirectory',
                'fileActionsReady',
                'updateFileList',
                'filesRefreshed'
            ];
            
            eventsToListen.forEach(eventName => {
                if (window.OCA.Files.App && window.OCA.Files.App.fileList) {
                    window.OCA.Files.App.fileList.$el.on(eventName, () => {
                        setTimeout(replaceTimestamps, 100);
                    });
                }
            });
            
            // Listen for scroll events on the file list container
            const fileListContainer = document.querySelector('#app-content-files') || document.querySelector('.files-list');
            if (fileListContainer) {
                let scrollTimeout;
                fileListContainer.addEventListener('scroll', () => {
                    // Debounce the scroll event
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(replaceTimestamps, 200);
                });
            }
        }
    }
    
    function init() {
        console.log('Absolute Timestamps initialized...');
        overrideNextcloudDateFunctions();
        replaceTimestamps();
        setupObserver();
        listenForNextcloudEvents();
    }
    document.addEventListener('DOMContentLoaded', init);
    document.addEventListener('filesready', init);
})();
