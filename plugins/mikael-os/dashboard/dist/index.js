var MikaelOSPlugin = function() {
  "use strict";
  const ICONS = {
    "monitor": '<rect width="20" height="14" x="2" y="3" rx="2" /> <line x1="8" x2="16" y1="21" y2="21" /> <line x1="12" x2="12" y1="17" y2="21" />',
    "monitor-check": '<path d="m9 10 2 2 4-4" /> <rect width="20" height="14" x="2" y="3" rx="2" /> <path d="M12 17v4" /> <path d="M8 21h8" />',
    "app-window": '<rect x="2" y="4" width="20" height="16" rx="2" /> <path d="M10 4v4" /> <path d="M2 8h20" /> <path d="M6 4v4" />',
    "wifi-off": '<path d="M12 20h.01" /> <path d="M8.5 16.429a5 5 0 0 1 7 0" /> <path d="M5 12.859a10 10 0 0 1 5.17-2.69" /> <path d="M19 12.859a10 10 0 0 0-2.007-1.523" /> <path d="M2 8.82a15 15 0 0 1 4.177-2.643" /> <path d="M22 8.82a15 15 0 0 0-11.288-3.764" /> <path d="m2 2 20 20" />',
    "link": '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /> <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />',
    "unlink": '<path d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" /> <path d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" /> <line x1="8" x2="8" y1="2" y2="5" /> <line x1="2" x2="5" y1="8" y2="8" /> <line x1="16" x2="16" y1="19" y2="22" /> <line x1="19" x2="22" y1="16" y2="16" />',
    "smartphone": '<rect width="14" height="20" x="5" y="2" rx="2" ry="2" /> <path d="M12 18h.01" />',
    "info": '<circle cx="12" cy="12" r="10" /> <path d="M12 16v-4" /> <path d="M12 8h.01" />',
    "radar": '<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" /> <path d="M4 6h.01" /> <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" /> <path d="M16.24 7.76A6 6 0 1 0 8.23 16.67" /> <path d="M12 18h.01" /> <path d="M17.99 11.66A6 6 0 0 1 15.77 16.67" /> <circle cx="12" cy="12" r="2" /> <path d="m13.41 10.59 5.66-5.66" />',
    "route": '<circle cx="6" cy="19" r="3" /> <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /> <circle cx="18" cy="5" r="3" />',
    "wrench": '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />',
    "clipboard-list": '<rect width="8" height="4" x="8" y="2" rx="1" ry="1" /> <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /> <path d="M12 11h4" /> <path d="M12 16h4" /> <path d="M8 11h.01" /> <path d="M8 16h.01" />',
    "folder-check": '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /> <path d="m9 13 2 2 4-4" />',
    "briefcase": '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /> <rect width="20" height="14" x="2" y="6" rx="2" />',
    "file-text": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /> <path d="M14 2v4a2 2 0 0 0 2 2h4" /> <path d="M10 9H8" /> <path d="M16 13H8" /> <path d="M16 17H8" />',
    "database": '<ellipse cx="12" cy="5" rx="9" ry="3" /> <path d="M3 5V19A9 3 0 0 0 21 19V5" /> <path d="M3 12A9 3 0 0 0 21 12" />',
    "database-backup": '<ellipse cx="12" cy="5" rx="9" ry="3" /> <path d="M3 12a9 3 0 0 0 5 2.69" /> <path d="M21 9.3V5" /> <path d="M3 5v14a9 3 0 0 0 6.47 2.88" /> <path d="M12 12v4h4" /> <path d="M13 20a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5c-1.33 0-2.54.54-3.41 1.41L12 16" />',
    "file-plus": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /> <path d="M14 2v4a2 2 0 0 0 2 2h4" /> <path d="M9 15h6" /> <path d="M12 18v-6" />',
    "calendar-check": '<path d="M8 2v4" /> <path d="M16 2v4" /> <rect width="18" height="18" x="3" y="4" rx="2" /> <path d="M3 10h18" /> <path d="m9 16 2 2 4-4" />',
    "arrow-up-right": '<path d="M7 7h10v10" /> <path d="M7 17 17 7" />',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /> <circle cx="9" cy="7" r="4" /> <path d="M22 21v-2a4 4 0 0 0-3-3.87" /> <path d="M16 3.13a4 4 0 0 1 0 7.75" />',
    "user-round": '<circle cx="12" cy="8" r="5" /> <path d="M20 21a8 8 0 0 0-16 0" />',
    "cpu": '<rect width="16" height="16" x="4" y="4" rx="2" /> <rect width="6" height="6" x="9" y="9" rx="1" /> <path d="M15 2v2" /> <path d="M15 20v2" /> <path d="M2 15h2" /> <path d="M2 9h2" /> <path d="M20 15h2" /> <path d="M20 9h2" /> <path d="M9 2v2" /> <path d="M9 20v2" />',
    "power": '<path d="M12 2v10" /> <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />',
    "circle-help": '<circle cx="12" cy="12" r="10" /> <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /> <path d="M12 17h.01" />',
    "list-checks": '<path d="m3 17 2 2 4-4" /> <path d="m3 7 2 2 4-4" /> <path d="M13 6h8" /> <path d="M13 12h8" /> <path d="M13 18h8" />',
    "folder-open": '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />',
    "sparkles": '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /> <path d="M20 3v4" /> <path d="M22 5h-4" /> <path d="M4 17v2" /> <path d="M5 18H3" />',
    "orbit": '<circle cx="12" cy="12" r="3" /> <circle cx="19" cy="5" r="2" /> <circle cx="5" cy="19" r="2" /> <path d="M10.4 21.9a10 10 0 0 0 9.941-15.416" /> <path d="M13.5 2.1a10 10 0 0 0-9.841 15.416" />',
    "sun": '<circle cx="12" cy="12" r="4" /> <path d="M12 2v2" /> <path d="M12 20v2" /> <path d="m4.93 4.93 1.41 1.41" /> <path d="m17.66 17.66 1.41 1.41" /> <path d="M2 12h2" /> <path d="M20 12h2" /> <path d="m6.34 17.66-1.41 1.41" /> <path d="m19.07 4.93-1.41 1.41" />',
    "calendar-days": '<path d="M8 2v4" /> <path d="M16 2v4" /> <rect width="18" height="18" x="3" y="4" rx="2" /> <path d="M3 10h18" /> <path d="M8 14h.01" /> <path d="M12 14h.01" /> <path d="M16 14h.01" /> <path d="M8 18h.01" /> <path d="M12 18h.01" /> <path d="M16 18h.01" />',
    "circle-check-big": '<path d="M21.801 10A10 10 0 1 1 17 3.335" /> <path d="m9 11 3 3L22 4" />',
    "target": '<circle cx="12" cy="12" r="10" /> <circle cx="12" cy="12" r="6" /> <circle cx="12" cy="12" r="2" />',
    "flame": '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />',
    "dumbbell": '<path d="M14.4 14.4 9.6 9.6" /> <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" /> <path d="m21.5 21.5-1.4-1.4" /> <path d="M3.9 3.9 2.5 2.5" /> <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" />',
    "droplet": '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />',
    "footprints": '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z" /> <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z" /> <path d="M16 17h4" /> <path d="M4 13h4" />',
    "code-xml": '<path d="m18 16 4-4-4-4" /> <path d="m6 8-4 4 4 4" /> <path d="m14.5 4-5 16" />',
    "server": '<rect width="20" height="8" x="2" y="2" rx="2" ry="2" /> <rect width="20" height="8" x="2" y="14" rx="2" ry="2" /> <line x1="6" x2="6.01" y1="6" y2="6" /> <line x1="6" x2="6.01" y1="18" y2="18" />',
    "notebook-pen": '<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" /> <path d="M2 6h4" /> <path d="M2 10h4" /> <path d="M2 14h4" /> <path d="M2 18h4" /> <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />',
    "radio-tower": '<path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9" /> <path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5" /> <circle cx="12" cy="9" r="2" /> <path d="M16.2 4.8c2 2 2.26 5.11.8 7.47" /> <path d="M19.1 1.9a9.96 9.96 0 0 1 0 14.1" /> <path d="M9.5 18h5" /> <path d="m8 22 4-11 4 11" />',
    "lock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /> <path d="M7 11V7a5 5 0 0 1 10 0v4" />',
    "calendar-plus": '<path d="M8 2v4" /> <path d="M16 2v4" /> <path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" /> <path d="M3 10h18" /> <path d="M16 19h6" /> <path d="M19 16v6" />',
    "calendar-clock": '<path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" /> <path d="M16 2v4" /> <path d="M8 2v4" /> <path d="M3 10h5" /> <path d="M17.5 17.5 16 16.25V14" /> <circle cx="16" cy="16" r="6" />',
    "mic": '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /> <path d="M19 10v2a7 7 0 0 1-14 0v-2" /> <line x1="12" x2="12" y1="19" y2="22" />',
    "circle-plus": '<circle cx="12" cy="12" r="10" /> <path d="M8 12h8" /> <path d="M12 8v8" />',
    "grip-vertical": '<circle cx="9" cy="12" r="1" /> <circle cx="9" cy="5" r="1" /> <circle cx="9" cy="19" r="1" /> <circle cx="15" cy="12" r="1" /> <circle cx="15" cy="5" r="1" /> <circle cx="15" cy="19" r="1" />',
    "clock": '<circle cx="12" cy="12" r="10" /> <polyline points="12 6 12 12 16 14" />',
    "user": '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /> <circle cx="12" cy="7" r="4" />',
    "chevron-down": '<path d="m6 9 6 6 6-6" />',
    "shield-check": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /> <path d="m9 12 2 2 4-4" />',
    "flask-conical": '<path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" /> <path d="M6.453 15h11.094" /> <path d="M8.5 2h7" />',
    "cloud-moon": '<path d="M10.188 8.5A6 6 0 0 1 16 4a1 1 0 0 0 6 6 6 6 0 0 1-3 5.197" /> <path d="M13 16a3 3 0 1 1 0 6H7a5 5 0 1 1 4.9-6Z" />',
    "plane": '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />',
    "leaf": '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /> <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />',
    "heart-pulse": '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /> <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />',
    "graduation-cap": '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /> <path d="M22 10v6" /> <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />',
    "book-open": '<path d="M12 7v14" /> <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />',
    "settings": '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /> <circle cx="12" cy="12" r="3" />',
    "brain": '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" /> <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" /> <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" /> <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" /> <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" /> <path d="M3.477 10.896a4 4 0 0 1 .585-.396" /> <path d="M19.938 10.5a4 4 0 0 1 .585.396" /> <path d="M6 18a4 4 0 0 1-1.967-.516" /> <path d="M19.967 17.484A4 4 0 0 1 18 18" />',
    "lightbulb": '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /> <path d="M9 18h6" /> <path d="M10 22h4" />',
    "zap": '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />',
    "ear": '<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" /> <path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4" />',
    "circle": '<circle cx="12" cy="12" r="10" />',
    "send-horizontal": '<path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" /> <path d="M6 12h16" />',
    "command": '<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />',
    "pin": '<path d="M12 17v5" /> <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />',
    "chevron-up": '<path d="m18 15-6-6-6 6" />',
    "ellipsis": '<circle cx="12" cy="12" r="1" /> <circle cx="19" cy="12" r="1" /> <circle cx="5" cy="12" r="1" />',
    "git-branch": '<line x1="6" x2="6" y1="3" y2="15" /> <circle cx="18" cy="6" r="3" /> <circle cx="6" cy="18" r="3" /> <path d="M18 9a9 9 0 0 1-9 9" />',
    "message-square": '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />',
    "share-2": '<circle cx="18" cy="5" r="3" /> <circle cx="6" cy="12" r="3" /> <circle cx="18" cy="19" r="3" /> <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /> <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />',
    "panels-top-left": '<rect width="18" height="18" x="3" y="3" rx="2" /> <path d="M3 9h18" /> <path d="M9 21V9" />',
    "building-2": '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /> <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /> <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /> <path d="M10 6h4" /> <path d="M10 10h4" /> <path d="M10 14h4" /> <path d="M10 18h4" />',
    "wifi": '<path d="M12 20h.01" /> <path d="M2 8.82a15 15 0 0 1 20 0" /> <path d="M5 12.859a10 10 0 0 1 14 0" /> <path d="M8.5 16.429a5 5 0 0 1 7 0" />',
    "layout-grid": '<rect width="7" height="7" x="3" y="3" rx="1" /> <rect width="7" height="7" x="14" y="3" rx="1" /> <rect width="7" height="7" x="14" y="14" rx="1" /> <rect width="7" height="7" x="3" y="14" rx="1" />',
    "rocket": '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /> <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /> <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /> <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />',
    "flask-round": '<path d="M10 2v6.292a7 7 0 1 0 4 0V2" /> <path d="M5 15h14" /> <path d="M8.5 2h7" />',
    "folder-open": '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />',
    "x": '<path d="M18 6 6 18" /> <path d="m6 6 12 12" />',
    "chevron-right": '<path d="m9 18 6-6-6-6" />',
    "arrow-right": '<path d="M5 12h14" /> <path d="m12 5 7 7-7 7" />',
    "activity": '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />',
    "loader": '<path d="M12 2v4" /> <path d="m16.2 7.8 2.9-2.9" /> <path d="M18 12h4" /> <path d="m16.2 16.2 2.9 2.9" /> <path d="M12 18v4" /> <path d="m4.9 19.1 2.9-2.9" /> <path d="M2 12h4" /> <path d="m4.9 4.9 2.9 2.9" />',
    "inbox": '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /> <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />',
    "unplug": '<path d="m19 5 3-3" /> <path d="m2 22 3-3" /> <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" /> <path d="M7.5 13.5 10 11" /> <path d="M10.5 16.5 13 14" /> <path d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z" />',
    "moon": '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />',
    "map": '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" /> <path d="M15 5.764v15" /> <path d="M9 3.236v15" />',
    "utensils": '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /> <path d="M7 2v20" /> <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />',
    "keyboard": '<path d="M10 8h.01" /> <path d="M12 12h.01" /> <path d="M14 8h.01" /> <path d="M16 12h.01" /> <path d="M18 8h.01" /> <path d="M6 8h.01" /> <path d="M7 16h10" /> <path d="M8 12h.01" /> <rect width="20" height="16" x="2" y="4" rx="2" />',
    "audio-lines": '<path d="M2 10v3" /> <path d="M6 6v11" /> <path d="M10 3v18" /> <path d="M14 8v7" /> <path d="M18 5v13" /> <path d="M22 10v3" />',
    "house": '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /> <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />',
    "layers": '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" /> <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" /> <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />',
    "list": '<path d="M3 12h.01" /> <path d="M3 18h.01" /> <path d="M3 6h.01" /> <path d="M8 12h13" /> <path d="M8 18h13" /> <path d="M8 6h13" />',
    "waypoints": '<circle cx="12" cy="4.5" r="2.5" /> <path d="m10.2 6.3-3.9 3.9" /> <circle cx="4.5" cy="12" r="2.5" /> <path d="M7 12h10" /> <circle cx="19.5" cy="12" r="2.5" /> <path d="m13.8 17.7 3.9-3.9" /> <circle cx="12" cy="19.5" r="2.5" />',
    "gauge": '<path d="m12 14 4-4" /> <path d="M3.34 19a10 10 0 1 1 17.32 0" />',
    "moon-star": '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9" /> <path d="M20 3v4" /> <path d="M22 5h-4" />',
    "circle-user": '<circle cx="12" cy="12" r="10" /> <circle cx="12" cy="10" r="3" /> <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />',
    "list-todo": '<rect x="3" y="5" width="6" height="6" rx="1" /> <path d="m3 17 2 2 4-4" /> <path d="M13 6h8" /> <path d="M13 12h8" /> <path d="M13 18h8" />',
    "chevron-left": '<path d="m15 18-6-6 6-6" />',
    "ban": '<circle cx="12" cy="12" r="10" /> <path d="m4.9 4.9 14.2 14.2" />',
    "triangle-alert": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /> <path d="M12 9v4" /> <path d="M12 17h.01" />',
    "rotate-ccw": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /> <path d="M3 3v5h5" />',
    "hourglass": '<path d="M5 22h14" /> <path d="M5 2h14" /> <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /> <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />',
    "fast-forward": '<polygon points="13 19 22 12 13 5 13 19" /> <polygon points="2 19 11 12 2 5 2 19" />',
    "eye": '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /> <circle cx="12" cy="12" r="3" />',
    "play": '<polygon points="6 3 20 12 6 21 6 3" />',
    "party-popper": '<path d="M5.8 11.3 2 22l10.7-3.79" /> <path d="M4 3h.01" /> <path d="M22 8h.01" /> <path d="M15 2h.01" /> <path d="M22 20h.01" /> <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" /> <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" /> <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" /> <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" />',
    "layout-dashboard": '<rect width="7" height="9" x="3" y="3" rx="1" /> <rect width="7" height="5" x="14" y="3" rx="1" /> <rect width="7" height="9" x="14" y="12" rx="1" /> <rect width="7" height="5" x="3" y="16" rx="1" />',
    "battery-full": '<rect width="16" height="10" x="2" y="7" rx="2" ry="2" /> <line x1="22" x2="22" y1="11" y2="13" /> <line x1="6" x2="6" y1="11" y2="13" /> <line x1="10" x2="10" y1="11" y2="13" /> <line x1="14" x2="14" y1="11" y2="13" />',
    "battery-low": '<rect width="16" height="10" x="2" y="7" rx="2" ry="2" /> <line x1="22" x2="22" y1="11" y2="13" /> <line x1="6" x2="6" y1="11" y2="13" />',
    "server-off": '<path d="M7 2h13a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-5" /> <path d="M10 10 2.5 2.5C2 2 2 2.5 2 5v3a2 2 0 0 0 2 2h6z" /> <path d="M22 17v-1a2 2 0 0 0-2-2h-1" /> <path d="M4 14a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16.5l1-.5.5.5-8-8H4z" /> <path d="M6 18h.01" /> <path d="m2 2 20 20" />',
    "octagon-alert": '<path d="M12 16h.01" /> <path d="M12 8v4" /> <path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z" />',
    "hash": '<line x1="4" x2="20" y1="9" y2="9" /> <line x1="4" x2="20" y1="15" y2="15" /> <line x1="10" x2="8" y1="3" y2="21" /> <line x1="16" x2="14" y1="3" y2="21" />',
    "external-link": '<path d="M15 3h6v6" /> <path d="M10 14 21 3" /> <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />',
    "trending-up": '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /> <polyline points="16 7 22 7 22 13" />',
    "banknote": '<rect width="20" height="12" x="2" y="6" rx="2" /> <circle cx="12" cy="12" r="2" /> <path d="M6 12h.01M18 12h.01" />',
    "refresh-cw": '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /> <path d="M21 3v5h-5" /> <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /> <path d="M8 16H3v5" />',
    "radio": '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /> <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" /> <circle cx="12" cy="12" r="2" /> <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" /> <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />',
    "search": '<circle cx="11" cy="11" r="8" /> <path d="m21 21-4.3-4.3" />',
    "search-x": '<path d="m13.5 8.5-5 5" /> <path d="m8.5 8.5 5 5" /> <circle cx="11" cy="11" r="8" /> <path d="m21 21-4.3-4.3" />',
    "terminal": '<polyline points="4 17 10 11 4 5" /> <line x1="12" x2="20" y1="19" y2="19" />',
    "bot": '<path d="M12 8V4H8" /> <rect width="16" height="12" x="4" y="8" rx="2" /> <path d="M2 14h2" /> <path d="M20 14h2" /> <path d="M15 13v2" /> <path d="M9 13v2" />',
    "send": '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /> <path d="m21.854 2.147-10.94 10.939" />',
    "history": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /> <path d="M3 3v5h5" /> <path d="M12 7v5l4 2" />',
    "mail": '<rect width="20" height="16" x="2" y="4" rx="2" /> <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />',
    "filter": '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />',
    "eye-off": '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /> <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /> <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /> <path d="m2 2 20 20" />'
  };
  const SDK = typeof window !== "undefined" ? window.__HERMES_PLUGIN_SDK__ : void 0;
  const React = SDK && SDK.React;
  const H = SDK && SDK.hooks || {};
  const useState = H.useState || (() => [void 0, () => {
  }]);
  const useEffect = H.useEffect || (() => {
  });
  const useRef = H.useRef || (() => ({ current: null }));
  const useCallback = H.useCallback || ((fn) => fn);
  const useMemo = H.useMemo || ((fn) => typeof fn === "function" ? fn() : fn);
  const h = React ? React.createElement : () => null;
  function useMediaQuery(query) {
    const [match, setMatch] = useState(function() {
      try {
        return typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false;
      } catch (e) {
        return false;
      }
    });
    useEffect(function() {
      if (typeof window === "undefined" || !window.matchMedia) return;
      const mql = window.matchMedia(query);
      const on = function() {
        setMatch(mql.matches);
      };
      on();
      if (mql.addEventListener) mql.addEventListener("change", on);
      else if (mql.addListener) mql.addListener(on);
      return function() {
        if (mql.removeEventListener) mql.removeEventListener("change", on);
        else if (mql.removeListener) mql.removeListener(on);
      };
    }, [query]);
    return match;
  }
  function Icon(props) {
    const { name, size = 20, className = "", label } = props;
    const inner = ICONS[name] || ICONS.circle;
    const decorative = !label;
    return h("span", {
      className: "mos__icon " + className,
      style: { width: size, height: size },
      role: decorative ? void 0 : "img",
      "aria-label": decorative ? void 0 : label,
      "aria-hidden": decorative ? "true" : void 0,
      dangerouslySetInnerHTML: {
        __html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>"
      }
    });
  }
  const MODULES = [
    { id: "tasks", title: "Aufgaben & Ziele", icon: "list-todo", accent: "amber", meta: "Quelle wird geprüft", metric: "—", metricSub: "Aufgaben", pos: { x: 47, y: 9 } },
    { id: "learning", title: "Lernplan", icon: "graduation-cap", accent: "violet", meta: "Quelle wird geprüft", metric: "—", metricSub: "Lernen", pos: { x: 67, y: 14 } },
    { id: "risel", title: "Rise-L Prozesse", icon: "server", accent: "blue", meta: "Quelle wird geprüft", metric: "—", metricSub: "Prozesse", pos: { x: 86, y: 22 } },
    { id: "travel", title: "Reisen", icon: "plane", accent: "cyan", meta: "Noch nicht verbunden", metric: "—", metricSub: "Reisen", pos: { x: 89, y: 41 } },
    { id: "nutrition", title: "Ernährung", icon: "leaf", accent: "emerald", meta: "Noch nicht verbunden", metric: "—", metricSub: "Ernährung", pos: { x: 89, y: 58 } },
    { id: "company", title: "Firma-Signale", icon: "building-2", accent: "neutral", meta: "Nur lesen", metric: "—", metricSub: "Nur lesen", readOnly: true, pos: { x: 85, y: 75 } },
    { id: "journal", title: "Journal", icon: "notebook-pen", accent: "neutral", meta: "Noch nicht verbunden", metric: "—", metricSub: "Journal", pos: { x: 13, y: 70 } },
    { id: "body", title: "Körper / WHOOP", icon: "heart-pulse", accent: "emerald", meta: "Quelle wird geprüft", metric: "—", metricSub: "Körperstatus", pos: { x: 9, y: 51 } },
    { id: "kalender", title: "Kalender", icon: "calendar-days", accent: "cyan", meta: "Quelle wird geprüft", metric: "—", metricSub: "nächstes Ereignis", pos: { x: 11, y: 32 } },
    { id: "today", title: "Heute", icon: "sun", accent: "cyan", meta: "Quelle wird geprüft", metric: "—", metricSub: "Ereignisse", pos: { x: 26, y: 15 } }
  ];
  ({
    long: new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      weekday: "long",
      day: "2-digit",
      month: "long"
    }).format(/* @__PURE__ */ new Date()),
    short: new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      weekday: "short",
      day: "2-digit",
      month: "2-digit"
    }).format(/* @__PURE__ */ new Date())
  });
  const CORE_POS = { x: 50, y: 33 };
  const PERIODS = [
    { id: "morgen", label: "Morgen", icon: "sun" },
    { id: "mittag", label: "Mittag", icon: "cloud-moon" },
    { id: "abend", label: "Abend", icon: "moon-star" }
  ];
  const LENS = {
    engineering: { icon: "code-xml", accent: "violet", title: "Engineering / Codex", sub: "mission.v2", rows: [] },
    today: { icon: "sun", accent: "cyan", title: "Heute", sub: "Kalender-Projektion", rows: [] },
    tasks: { icon: "target", accent: "emerald", title: "Aufgaben & Ziele", sub: "mission.v2 + Policy", rows: [] },
    learning: { icon: "graduation-cap", accent: "violet", title: "Lernplan", sub: "Anki + Crashcamp", rows: [] },
    risel: { icon: "server", accent: "amber", title: "Rise-L Prozesse", sub: "systemd + Registry", rows: [] },
    travel: { icon: "plane", accent: "cyan", title: "Reisen", sub: "Noch nicht verbunden", rows: [] },
    nutrition: { icon: "leaf", accent: "emerald", title: "Ernährung", sub: "Noch nicht verbunden", rows: [] },
    company: { icon: "building-2", accent: "neutral", title: "Firma-Signale", sub: "Read-only", rows: [] },
    kalender: { icon: "calendar-days", accent: "cyan", title: "Kalender", sub: "calendar-evidence", rows: [] },
    body: { icon: "heart-pulse", accent: "emerald", title: "Körper / WHOOP", sub: "WHOOP-Connector", rows: [] },
    journal: { icon: "notebook-pen", accent: "cyan", title: "Journal", sub: "Noch nicht verbunden", rows: [] }
  };
  const NOT_WIRED = "Noch nicht verbunden — in dieser Fläche keine Ausführung.";
  const LENS_TOOLS = [
    { icon: "folder-open", label: "Öffnen" },
    { icon: "panels-top-left", label: "Details" },
    { icon: "message-square", label: "Kommentare" },
    { icon: "share-2", label: "Handover" },
    { icon: "ellipsis", label: "Mehr" }
  ];
  const CHIPS = [
    { icon: "sparkles", label: "Beispiele" },
    { icon: "target", label: "Öffne Fokus-Modus" },
    { icon: "clock", label: "Plane Deep Work um 09:00" },
    { icon: "graduation-cap", label: "Zeige meinen Lernplan" }
  ];
  const STATES = [
    { id: "ready", icon: "circle", label: "Bereit", tone: "ready" },
    { id: "listening", icon: "ear", label: "Hört zu", tone: "listen" },
    { id: "thinking", icon: "brain", label: "Denkt", tone: "think" },
    // FOKUS — deep-work / focus mode (violet), matches jd-master-A/B state rail.
    { id: "focus", icon: "target", label: "Fokus", tone: "focus" },
    { id: "suggest", icon: "lightbulb", label: "Vorschlag", tone: "amber" },
    { id: "executing", icon: "zap", label: "Ausführung", tone: "exec" },
    { id: "verified", icon: "circle-check-big", label: "Verifiziert", tone: "verified" }
  ];
  const WORKSPACES = [
    { id: "private", label: "Privat" },
    { id: "engineering", label: "Engineering" },
    { id: "company_signal", label: "Firma-Signale" }
  ];
  function jarvisStateText(index) {
    const s = STATES[index] || STATES[0];
    if (s.id === "listening") return "Ich höre zu";
    return s.label;
  }
  function LiveAnnouncer(props) {
    return h(
      "div",
      { className: "mos__sr-only", role: "status", "aria-live": "polite", "aria-atomic": "true" },
      props.message || ""
    );
  }
  const PLUGIN_API = "/api/plugins/mikael-os";
  const PROPOSE_API = PLUGIN_API + "/actions/propose";
  const RECEIPT_API = PLUGIN_API + "/actions/receipt";
  const REVIEW_API = PLUGIN_API + "/review/session";
  const STUDY_PLAN_API = PLUGIN_API + "/study/plan";
  const FEYNMAN_API = PLUGIN_API + "/study/feynman";
  const FEYNMAN_EVAL_API = PLUGIN_API + "/study/feynman/evaluate";
  const STUDY_PROPOSE_API = PLUGIN_API + "/study/plan/propose";
  const LEARNING_INTAKE_API = PLUGIN_API + "/learning/intake/analyze";
  const KPI_API = PLUGIN_API + "/cockpit/kpi";
  const JARVIS_STATE_API = PLUGIN_API + "/cockpit/jarvis-state";
  const VOICE_OPEN_EVENT = "mikael-os:voice-open";
  const VOICE_STATUS_API = PLUGIN_API + "/jarvis/voice/status";
  const VOICE_PREPARE_API = PLUGIN_API + "/jarvis/voice/prepare";
  const VOICE_SESSION_API = PLUGIN_API + "/jarvis/voice/session";
  const VOICE_CONTROL_API = PLUGIN_API + "/jarvis/voice/control";
  const LEARNING_LAUNCH_API = PLUGIN_API + "/learning/konstruktionslehre/launch";
  const APPROVALS_API = PLUGIN_API + "/cockpit/approvals";
  const FIRMA_OVERVIEW_API = PLUGIN_API + "/firma/overview";
  const FIRMA_APPROVAL_DETAIL_API = PLUGIN_API + "/firma/approvals/detail";
  const WISSEN_SEARCH_API = PLUGIN_API + "/wissen/search";
  const KOMM_OVERVIEW_API = PLUGIN_API + "/kommunikation/overview";
  const SESSIONS_OVERVIEW_API = PLUGIN_API + "/agent-sessions/overview";
  const ZIELE_OVERVIEW_API = PLUGIN_API + "/ziele/overview";
  const REFLEXION_OVERVIEW_API = PLUGIN_API + "/reflexion/overview";
  const GESUNDHEIT_OVERVIEW_API = PLUGIN_API + "/gesundheit/overview";
  const BETRIEB_OVERVIEW_API = PLUGIN_API + "/betrieb/overview";
  const LIFE_OVERVIEW_API = PLUGIN_API + "/life/overview";
  const MAC_PROPOSE_API = PLUGIN_API + "/betrieb/mac/propose";
  const PWA_MANIFEST_HREF = PLUGIN_API + "/pwa/manifest.webmanifest";
  const PWA_SW_HREF = PLUGIN_API + "/pwa/sw.js";
  MODULES.reduce((acc, m) => {
    acc[m.id] = m.pos;
    return acc;
  }, {});
  function sdkPost(url, body) {
    const sdk = typeof window !== "undefined" && window.__HERMES_PLUGIN_SDK__ || {};
    if (typeof sdk.postJSON === "function") return Promise.resolve(sdk.postJSON(url, body));
    if (typeof sdk.authedFetch === "function") {
      return Promise.resolve(sdk.authedFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })).then((r) => r && typeof r.json === "function" ? r.json() : r);
    }
    if (typeof fetch === "function") {
      return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.ok ? r.json() : Promise.reject(r.status));
    }
    return Promise.reject(new Error("no transport"));
  }
  function sdkPostForm(url, form) {
    const sdk = typeof window !== "undefined" && window.__HERMES_PLUGIN_SDK__ || {};
    if (typeof sdk.authedFetch === "function") {
      return Promise.resolve(sdk.authedFetch(url, { method: "POST", body: form })).then((r) => r && typeof r.json === "function" ? r.json().then((body) => {
        if (r.ok === false) return Promise.reject(body);
        return body;
      }) : r);
    }
    if (typeof fetch === "function") {
      return fetch(url, { method: "POST", body: form }).then((r) => r.json().then((body) => r.ok ? body : Promise.reject(body)));
    }
    return Promise.reject(new Error("no transport"));
  }
  function sdkGet(url) {
    const sdk = typeof window !== "undefined" && window.__HERMES_PLUGIN_SDK__ || {};
    if (typeof sdk.fetchJSON === "function") return Promise.resolve(sdk.fetchJSON(url));
    if (typeof fetch === "function") return fetch(url).then((r) => r.ok ? r.json() : Promise.reject(r.status));
    return Promise.reject(new Error("no transport"));
  }
  function openJarvisChat(objective) {
    const text = String(objective || "").trim();
    if (!text || typeof window === "undefined") return;
    const sdk = window.__HERMES_PLUGIN_SDK__ || {};
    if (typeof sdk.openChat === "function") sdk.openChat(text);
    else window.location.assign("/chat?prompt=" + encodeURIComponent(text));
  }
  function sdkRequestJSON(url, method, body) {
    const sdk = typeof window !== "undefined" && window.__HERMES_PLUGIN_SDK__ || {};
    const opts = {
      method: method || "GET",
      headers: { "Content-Type": "application/json" },
      body: body == null ? void 0 : JSON.stringify(body),
      cache: "no-store"
    };
    const call = typeof sdk.authedFetch === "function" ? Promise.resolve(sdk.authedFetch(url, opts)) : typeof fetch === "function" ? fetch(url, opts) : Promise.reject(new Error("no transport"));
    return call.then((r) => {
      if (!r || typeof r.json !== "function") return { ok: true, body: r, status: 200 };
      return r.json().catch(() => ({})).then((payload) => ({
        ok: r.ok !== false && (r.status == null || r.status < 400),
        body: payload,
        status: r.status || 200
      }));
    });
  }
  function sdkResponseBody(result) {
    const body = result && result.body && typeof result.body === "object" ? result.body : {};
    return body.detail && typeof body.detail === "object" ? body.detail : body;
  }
  const PROPOSE_META = {
    compose: { tone: "amber", icon: "git-branch", label: "Entwurf" },
    loading: { tone: "muted", icon: "loader", label: "Baut Vorschau …" },
    preview: { tone: "amber", icon: "flask-conical", label: "Vorschlag-Vorschau (Dry-Run)" },
    submitting: { tone: "amber", icon: "loader", label: "Sende an Gate …" },
    waiting_approval: { tone: "amber", icon: "clock", label: "Wartet auf Freigabe" },
    approved: { tone: "cyan", icon: "shield-check", label: "Freigegeben" },
    executed: { tone: "emerald", icon: "circle-check-big", label: "Ausgeführt" },
    verified: { tone: "emerald", icon: "circle-check-big", label: "Verifiziert" },
    denied: { tone: "red", icon: "ban", label: "Abgelehnt" },
    error: { tone: "red", icon: "triangle-alert", label: "Fehler" },
    auth_pending: { tone: "gated", icon: "triangle-alert", label: "Freigabe-Anbindung: Auth ausstehend" }
  };
  const PROPOSE_TERMINAL = { approved: 1, executed: 1, verified: 1, denied: 1, error: 1, auth_pending: 1 };
  const PROPOSE_PROFILES = {
    engineering: {
      api: PROPOSE_API,
      icon: "git-branch",
      title: "Codex-Aufgabe vorschlagen",
      subKind: "Engineering",
      fieldLabel: "Was soll Codex / Engineering tun?",
      placeholder: "z. B. Refactor: Deploy-Check als eigenes Modul extrahieren …",
      scopeHint: "Nur Engineering · kein Geld / Kunde / Personal"
    },
    study: {
      api: STUDY_PROPOSE_API,
      icon: "graduation-cap",
      title: "Lernplan vorschlagen",
      subKind: "Studium · privat",
      fieldLabel: "Welchen Lernplan soll Jarvis bis zur Klausur bauen?",
      placeholder: "z. B. Lernplan bis Thermodynamik-Klausur — Spaced Repetition, ≥3 Abrufe/Thema …",
      scopeHint: "Nur Studium / privat · kein Geld / Kunde / Personal"
    }
  };
  function proposeProfile(st) {
    return PROPOSE_PROFILES[st && st.profile || "engineering"] || PROPOSE_PROFILES.engineering;
  }
  const STATE_META = {
    loading: { tone: "muted", label: "Lädt …" },
    fresh: { tone: "verified", label: "Live" },
    stale: { tone: "amber", label: "Veraltet" },
    partial: { tone: "blue", label: "Teilweise" },
    empty: { tone: "muted", label: "Leer" },
    unavailable: { tone: "red", label: "Nicht erreichbar" },
    error: { tone: "red", label: "Fehler" },
    // Source reachable but the plugin holds read-only scope for it — writes are
    // gated (Phase 3). Distinct blue-grey so it never reads as an error/alarm.
    gated: { tone: "gated", label: "Gated · nur lesen" }
  };
  function freshnessLabel(iso) {
    if (!iso) return null;
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return null;
    const s = Math.max(0, Math.round((Date.now() - t) / 1e3));
    if (s < 60) return "gerade eben";
    const m = Math.round(s / 60);
    if (m < 60) return "vor " + m + " Min";
    const h2 = Math.round(m / 60);
    if (h2 < 48) return "vor " + h2 + " Std";
    return "vor " + Math.round(h2 / 24) + " T";
  }
  function detectDisplayEnv() {
    if (typeof window === "undefined") {
      return {
        mode: "browser",
        modeLabel: "Browser-Tab",
        standalone: false,
        online: true,
        visibility: "visible"
      };
    }
    const mm = (q) => typeof window.matchMedia === "function" ? window.matchMedia(q).matches : false;
    const iosStandalone = typeof navigator !== "undefined" && navigator.standalone === true;
    let mode = "browser";
    if (mm("(display-mode: fullscreen)")) mode = "fullscreen";
    else if (mm("(display-mode: standalone)") || mm("(display-mode: window-controls-overlay)") || iosStandalone) mode = "standalone";
    else if (mm("(display-mode: minimal-ui)")) mode = "minimal-ui";
    const LABEL = {
      standalone: "Installiert / Kiosk",
      fullscreen: "Vollbild-Kiosk",
      "minimal-ui": "App-Fenster (minimal-ui)",
      browser: "Browser-Tab"
    };
    return {
      mode,
      modeLabel: LABEL[mode] || "Browser-Tab",
      standalone: mode !== "browser",
      online: typeof navigator === "undefined" ? true : navigator.onLine !== false,
      visibility: typeof document === "undefined" ? "visible" : document.visibilityState || "visible",
      secureContext: typeof window !== "undefined" ? !!window.isSecureContext : false
    };
  }
  function enrichModule(base, L, loading) {
    if (!L) return { ...base, _state: loading ? "loading" : "empty", _metric: base.metric, _metricSub: base.metricSub };
    return {
      ...base,
      title: L.title || base.title,
      icon: L.icon || base.icon,
      accent: L.accent || base.accent,
      meta: L.summary || base.meta,
      readOnly: L.readOnly != null ? L.readOnly : base.readOnly,
      _state: L.state || "fresh",
      _demo: !!L.demo,
      _source: L.source,
      _sourceKind: L.sourceKind,
      _observedAt: L.observedAt,
      _permission: L.permission,
      _note: L.note,
      _rows: Array.isArray(L.rows) ? L.rows : [],
      _metric: deriveMetric(base, L),
      _metricSub: L.demo ? base.metricSub : deriveMetricSub(base, L) || base.metricSub
    };
  }
  function deriveMetric(base, L) {
    if (!L || L.demo) return base.metric;
    if (base.id === "body") return L.tokenFresh ? base.metric : "Verbunden";
    if (base.id === "kalender") return L.nextTime || "—";
    if (base.id === "today") {
      if (L.privateCount == null && L.firmaCount == null) return "—";
      const priv = L.privateCount || 0;
      const firma = L.firmaCount || 0;
      return firma > 0 ? priv + "+" + firma : String(priv);
    }
    if (base.id === "learning") return L.due != null ? String(L.due) : "—";
    if (L.active != null) return String(L.active);
    if (L.count != null) return String(L.count);
    if (L.services && L.services.active != null) return String(L.services.active);
    if (L.pending != null) return String(L.pending);
    return base.metric;
  }
  function deriveMetricSub(base, L) {
    if (base.id === "body") return L.tokenFresh ? base.metricSub : "WHOOP verbunden";
    if (base.id === "kalender") return "nächster Termin · privat";
    if (base.id === "today") {
      return (L.firmaCount || 0) > 0 ? "privat + Dispo (Firma-Signal)" : "Termine · privat";
    }
    if (base.id === "learning") {
      if (L.due == null) return "Anki-Sync bereit";
      return "fällig" + (L.retentionPct ? " · " + L.retentionPct + " Retention" : "");
    }
    if (base.id === "tasks" && L.active != null) return "aktiv · " + (L.count || 0) + " gesamt";
    if (base.id === "engineering" && L.count != null) return "Missionen aktiv";
    if (base.id === "risel" && L.services) return "Dienste live";
    if (base.id === "company" && L.pending != null) return "Approval-Cards";
    return null;
  }
  function indexLive(live) {
    const byId = {};
    (live && live.modules ? live.modules : []).forEach((m) => {
      byId[m.id] = m;
    });
    return byId;
  }
  function prefersReducedMotion() {
    try {
      return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  }
  function Orb(props) {
    const canvasRef = useRef(null);
    const showLabel = !!(props && props.label);
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.getContext) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const reduce = prefersReducedMotion();
      let raf = 0;
      let running = true;
      let lastDraw = 0;
      const FRAME_MS = 33;
      const particles = [];
      for (let i = 0; i < 68; i++) {
        particles.push({
          ang: Math.random() * Math.PI * 2,
          rad: 0.18 + Math.random() * 0.78,
          spd: (0.12 + Math.random() * 0.45) * (Math.random() < 0.5 ? 1 : -1),
          size: 0.5 + Math.random() * 1.3,
          tilt: 0.34 + Math.random() * 0.5
        });
      }
      function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        const s = Math.max(rect.width, 1);
        canvas.width = s * dpr;
        canvas.height = s * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return s;
      }
      let size = resize();
      function draw(t) {
        const w = size, hgt = size;
        const cx = w / 2, cy = hgt / 2;
        const pulse = reduce ? 0.5 : Math.sin(t * 11e-4) * 0.5 + 0.5;
        const R = w / 2 * (0.9 + pulse * 0.02);
        const R0 = R * 0.82;
        ctx.clearRect(0, 0, w, hgt);
        ctx.globalCompositeOperation = "lighter";
        const bloom = ctx.createRadialGradient(cx, cy, R0 * 0.35, cx, cy, R * 1.18);
        bloom.addColorStop(0, "rgba(70,180,255," + (0.32 + pulse * 0.06) + ")");
        bloom.addColorStop(0.42, "rgba(48,140,235,0.16)");
        bloom.addColorStop(0.72, "rgba(34,96,190,0.07)");
        bloom.addColorStop(1, "rgba(8,20,40,0)");
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        const body = ctx.createRadialGradient(cx, cy - R0 * 0.1, R0 * 0.1, cx, cy, R0);
        body.addColorStop(0, "rgba(40,120,205,0.55)");
        body.addColorStop(0.55, "rgba(20,64,130,0.5)");
        body.addColorStop(0.85, "rgba(11,34,74,0.42)");
        body.addColorStop(1, "rgba(6,16,34,0.06)");
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(cx, cy, R0, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R0, 0, Math.PI * 2);
        ctx.clip();
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 3; i++) {
          const yy = cy + (i - 1) * R0 * 0.42;
          const rw = Math.sqrt(Math.max(0, R0 * R0 - (yy - cy) * (yy - cy)));
          ctx.beginPath();
          ctx.ellipse(cx, yy, rw, Math.max(rw * 0.14, 2), 0, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(96,165,225,0.09)";
          ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
          ctx.stroke();
        }
        const plasma = ctx.createRadialGradient(cx, cy + R0 * 0.2, R0 * 0.02, cx, cy + R0 * 0.16, R0 * 0.66);
        plasma.addColorStop(0, "rgba(206,246,255," + (0.8 + pulse * 0.06) + ")");
        plasma.addColorStop(0.24, "rgba(112,208,255,0.5)");
        plasma.addColorStop(0.58, "rgba(52,144,232,0.2)");
        plasma.addColorStop(1, "rgba(20,60,130,0)");
        ctx.fillStyle = plasma;
        ctx.beginPath();
        ctx.arc(cx, cy, R0, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const a = p.ang + (reduce ? 0 : t * 4e-4 * p.spd);
          const rx = R0 * 0.96 * p.rad;
          const px = cx + Math.cos(a) * rx;
          const py = cy + Math.sin(a) * rx * p.tilt;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(178,236,255," + (0.2 + (1 - p.rad) * 0.4) + ")";
          ctx.fill();
        }
        const wavePhase = reduce ? 0.6 : t * 15e-4;
        const waveFreq = 2.2, waveAmp = R * 0.13, waveY = cy + R0 * 0.15;
        const waveAt = (x) => {
          const nx = x / R;
          return Math.sin(nx * Math.PI * waveFreq + wavePhase) * Math.cos(nx * 1.1);
        };
        for (let b = 0; b < 3; b++) {
          const amp = waveAmp * (1 - b * 0.16);
          const yoff = waveY + (b - 1) * R * 0.045;
          const phase = wavePhase + b * 0.5;
          ctx.beginPath();
          for (let x = -R; x <= R; x += 3) {
            const nx = x / R;
            const y = yoff + Math.sin(nx * Math.PI * waveFreq + phase) * amp * Math.cos(nx * 1.1);
            if (x === -R) ctx.moveTo(cx + x, y);
            else ctx.lineTo(cx + x, y);
          }
          ctx.strokeStyle = "rgba(158,232,255," + (0.6 - b * 0.16) + ")";
          ctx.lineWidth = 2.4 - b * 0.6;
          ctx.shadowColor = "rgba(96,210,255,0.9)";
          ctx.shadowBlur = 16 - b * 3;
          ctx.stroke();
        }
        ctx.restore();
        ctx.globalCompositeOperation = "lighter";
        for (let dir = -1; dir <= 1; dir += 2) {
          const g = ctx.createLinearGradient(cx + dir * R0 * 0.9, 0, cx + dir * R, 0);
          g.addColorStop(0, "rgba(150,228,255,0.55)");
          g.addColorStop(1, "rgba(120,205,255,0)");
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.8;
          ctx.shadowColor = "rgba(96,210,255,0.8)";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          let first = true;
          for (let s = 0; s <= 1.0001; s += 0.04) {
            const x = dir * (R0 * 0.9 + s * (R - R0 * 0.9));
            const y = waveY + waveAt(x) * waveAmp;
            if (first) {
              ctx.moveTo(cx + x, y);
              first = false;
            } else ctx.lineTo(cx + x, y);
          }
          ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(cx, cy, R0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(150,220,255," + (0.3 + pulse * 0.14) + ")";
        ctx.lineWidth = 1.4;
        ctx.shadowColor = "rgba(96,205,255,0.6)";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, R0, Math.PI * 0.12, Math.PI * 0.88);
        ctx.strokeStyle = "rgba(180,238,255," + (0.5 + pulse * 0.22) + ")";
        ctx.lineWidth = 1.8;
        ctx.shadowColor = "rgba(120,220,255,0.9)";
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      function loop(t) {
        if (!running) return;
        if (t - lastDraw >= FRAME_MS) {
          lastDraw = t;
          draw(t);
        }
        raf = window.requestAnimationFrame(loop);
      }
      function onVisibility() {
        if (document.visibilityState === "hidden") {
          running = false;
          if (raf) window.cancelAnimationFrame(raf);
        } else if (!reduce && !running) {
          running = true;
          raf = window.requestAnimationFrame(loop);
        }
      }
      function onResize() {
        size = resize();
        if (reduce) draw(600);
      }
      if (reduce) {
        draw(600);
      } else {
        raf = window.requestAnimationFrame(loop);
      }
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("resize", onResize);
      return () => {
        running = false;
        if (raf) window.cancelAnimationFrame(raf);
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("resize", onResize);
      };
    }, []);
    return h(
      "div",
      { className: "mos__orb", "aria-hidden": "true" },
      h("canvas", { ref: canvasRef, className: "mos__orb-canvas" }),
      showLabel ? h("span", { className: "mos__orb-label" }, "JARVIS") : null
    );
  }
  function Connectors(props) {
    const ox = CORE_POS.x, oy = CORE_POS.y;
    return h(
      "svg",
      { className: "mos__connectors", "aria-hidden": "true", viewBox: "0 0 100 100", preserveAspectRatio: "none" },
      props.modules.map((m) => {
        const midX = (ox + m.pos.x) / 2;
        const midY = (oy + m.pos.y) / 2 - 4;
        const d = "M " + ox + " " + oy + " Q " + midX + " " + midY + " " + m.pos.x + " " + m.pos.y;
        const on = props.focusId === m.id;
        return h("path", {
          key: m.id,
          d,
          className: "mos__connector" + (on ? " is-active" : ""),
          vectorEffect: "non-scaling-stroke",
          fill: "none"
        });
      })
    );
  }
  function StatePip(props) {
    const m = props.module;
    const st = m._state || "loading";
    if (m._demo) {
      return h(
        "span",
        { className: "mos__pip mos__pip--konzept", title: m._note || "Konzeptdaten" },
        h(Icon, { name: "flask-conical", size: 11 }),
        "Konzept"
      );
    }
    const meta = STATE_META[st] || STATE_META.loading;
    const fresh = freshnessLabel(m._observedAt);
    const tip = [m._source && "Quelle: " + m._source, fresh && "Stand: " + fresh, m._note].filter(Boolean).join(" · ");
    return h(
      "span",
      { className: "mos__pip mos__pip--" + meta.tone, title: tip || meta.label },
      h("span", { className: "mos__pip-dot", "aria-hidden": "true" }),
      meta.label,
      fresh && (st === "fresh" || st === "stale" || st === "partial") ? h("span", { className: "mos__pip-age" }, fresh) : null
    );
  }
  function ModuleNode(props) {
    const m = props.module;
    const live = !m._demo && m._state === "fresh";
    const stale = !m._demo && (m._state === "stale" || m._state === "partial");
    const nodeState = live ? " is-live" : stale ? " is-stale" : "";
    return h(
      "div",
      {
        className: "mos__nodewrap mos--" + m.accent + (props.active ? " is-active" : "") + (props.dragging ? " is-dragging" : "") + nodeState,
        style: { left: m.pos.x + "%", top: m.pos.y + "%" }
      },
      h(
        "span",
        { className: "mos__orbitring", "aria-hidden": "true" },
        h("span", { className: "mos__sat mos__sat--a" }),
        h("span", { className: "mos__sat mos__sat--b" })
      ),
      h(
        "span",
        { className: "mos__orbitring mos__orbitring--2", "aria-hidden": "true" },
        h("span", { className: "mos__sat mos__sat--c" })
      ),
      h(
        "button",
        {
          type: "button",
          className: "mos__node",
          "aria-current": props.active ? "true" : void 0,
          "aria-label": m.title + " öffnen",
          onPointerDown: (e) => props.onPointerDown(e, m.id),
          onClick: () => props.onActivate(m.id)
        },
        h(
          "span",
          { className: "mos__node-orbit" },
          h("span", { className: "mos__node-pulse", "aria-hidden": "true" }),
          h(Icon, { name: m.icon, size: 22 })
        ),
        h(
          "span",
          { className: "mos__node-body" },
          h("span", { className: "mos__node-title" }, m.title),
          h("span", { className: "mos__node-meta" }, m.meta),
          h(StatePip, { module: m }),
          m.readOnly && h("span", { className: "mos__node-readonly" }, h(Icon, { name: "lock", size: 12 }), "Nur lesen")
        ),
        h("span", { className: "mos__node-grip", "aria-hidden": "true" }, h(Icon, { name: "grip-vertical", size: 14 }))
      )
    );
  }
  function LensRow(props) {
    const r = props.row;
    return h(
      "div",
      { className: "mos__mission mos--" + (r.accent || "cyan") },
      h("span", { className: "mos__mission-idx" }, String(props.index)),
      h("span", { className: "mos__mission-icon" }, h(Icon, { name: r.icon, size: 18 })),
      h(
        "span",
        { className: "mos__mission-body" },
        h("span", { className: "mos__mission-title" }, r.title),
        h("span", { className: "mos__mission-sub" }, r.sub)
      ),
      r.status ? h(
        "span",
        { className: "mos__status mos__status--" + r.status },
        r.status === "verified" && h(Icon, { name: "circle-check-big", size: 13 }),
        r.status === "waiting" && h(Icon, { name: "clock", size: 13 }),
        r.statusLabel
      ) : h("span", { className: "mos__status-spacer" }),
      h("span", { className: "mos__mission-pct" }, r.value)
    );
  }
  function resolveLens(focusId, liveModule) {
    const fixture = LENS[focusId] || LENS.engineering;
    const L = liveModule;
    const hasLive = L && !L._demo && Array.isArray(L._rows) && L._rows.length > 0;
    const st = L ? L._state || "loading" : "loading";
    if (hasLive) {
      const fresh = freshnessLabel(L._observedAt);
      return {
        icon: L.icon || fixture.icon,
        accent: L.accent || fixture.accent,
        title: L.title || fixture.title,
        sub: L.meta || fixture.sub,
        rows: L._rows,
        source: L._source || fixture.source,
        freshness: fresh || (st === "partial" ? "Verbindung ok" : "—"),
        permission: L._permission || fixture.permission,
        state: st,
        demo: false,
        note: L._note
      };
    }
    if (L && !L._demo && st !== "fresh") {
      return {
        icon: L.icon || fixture.icon,
        accent: L.accent || fixture.accent,
        title: L.title || fixture.title,
        sub: L.meta || fixture.sub,
        rows: Array.isArray(L._rows) ? L._rows : [],
        source: L._source || fixture.source,
        freshness: freshnessLabel(L._observedAt) || "—",
        permission: L._permission || fixture.permission,
        state: st,
        demo: false,
        note: L._note
      };
    }
    return {
      icon: L && L.icon || fixture.icon,
      accent: L && L.accent || fixture.accent,
      title: L && L.title || fixture.title,
      sub: L && L.meta || fixture.sub,
      rows: [],
      source: L && L._source || "Quelle wird geladen",
      freshness: "—",
      permission: L && L._permission || "—",
      state: L ? L._state || "empty" : "loading",
      demo: false,
      note: L && L._note || "Keine bestätigte Quelle; keine Konzeptwerte angezeigt."
    };
  }
  const LENS_MAX_ROWS = 4;
  function FocusLens(props) {
    const data = resolveLens(props.focusId, props.liveModule);
    const closable = props.focusId !== "engineering";
    const stMeta = STATE_META[data.state] || STATE_META.loading;
    const allRows = data.rows || [];
    const rows = allRows.slice(0, LENS_MAX_ROWS);
    const extraRows = allRows.length - rows.length;
    return h(
      "section",
      { className: "mos__lens", "aria-label": "Fokus-Linse: " + data.title, key: props.focusId },
      h(
        "header",
        { className: "mos__lens-head" },
        h("span", { className: "mos__lens-badge mos--" + data.accent }, h(Icon, { name: data.icon, size: 22 })),
        h(
          "span",
          { className: "mos__lens-titles" },
          h("span", { className: "mos__lens-title" }, data.title),
          h("span", { className: "mos__lens-sub" }, data.sub)
        ),
        h(
          "span",
          {
            className: "mos__lens-state mos__pip mos__pip--" + (data.demo ? "konzept" : stMeta.tone),
            title: data.note || stMeta.label
          },
          data.demo ? h(Icon, { name: "flask-conical", size: 12 }) : h("span", { className: "mos__pip-dot", "aria-hidden": "true" }),
          data.demo ? "Konzept" : stMeta.label
        ),
        h(
          "span",
          { className: "mos__lens-actions" },
          h("button", { type: "button", className: "mos__iconbtn", "aria-label": "Anheften", title: NOT_WIRED }, h(Icon, { name: "pin", size: 18 })),
          h("button", { type: "button", className: "mos__iconbtn", "aria-label": "Einklappen", title: NOT_WIRED }, h(Icon, { name: "chevron-up", size: 18 })),
          h("button", { type: "button", className: "mos__iconbtn", "aria-label": "Weitere Optionen", title: NOT_WIRED }, h(Icon, { name: "ellipsis", size: 18 })),
          closable && h(
            "button",
            { type: "button", className: "mos__iconbtn mos__iconbtn--close", "aria-label": "Fokus schließen", onClick: props.onClose },
            h(Icon, { name: "x", size: 18 })
          )
        )
      ),
      h(
        "div",
        { className: "mos__lens-body" },
        rows.length ? [
          ...rows.map((r, i) => h(LensRow, { key: r.title + i, row: r, index: i + 1 })),
          extraRows > 0 ? h(
            "div",
            { key: "more", className: "mos__lens-more" },
            h(Icon, { name: "ellipsis", size: 14 }),
            "+" + extraRows + " weitere",
            h("span", { className: "mos__lens-more-src" }, " · " + data.source)
          ) : null
        ] : h(
          "div",
          { className: "mos__lens-empty mos--" + (STATE_META[data.state] || STATE_META.loading).tone },
          h(Icon, { name: data.state === "unavailable" || data.state === "error" ? "unplug" : "inbox", size: 22 }),
          h("span", { className: "mos__lens-empty-title" }, stMeta.label),
          h("span", { className: "mos__lens-empty-note" }, data.note || "Keine Daten von dieser Quelle.")
        )
      ),
      h(
        "footer",
        { className: "mos__lens-foot" },
        h("span", { className: "mos__meta mos__meta--src" }, h(Icon, { name: "git-branch", size: 14 }), "Quelle: ", h("b", null, data.source)),
        h("span", { className: "mos__meta mos__meta--fresh" }, h(Icon, { name: "clock", size: 14 }), "Aktualität: ", h("b", null, data.freshness)),
        h("span", { className: "mos__meta mos__meta--perm" }, h(Icon, { name: "shield-check", size: 14, label: "Berechtigungen geprüft" }), "Berechtigung: ", h("b", null, data.permission))
      ),
      h(
        "div",
        { className: "mos__lens-tools" },
        // The ONE wired action: propose an engineering/Codex task (propose-only,
        // gate-led). Everything else here stays honestly "noch nicht verbunden".
        props.onPropose ? h("button", {
          key: "propose",
          type: "button",
          className: "mos__tool mos__tool--propose",
          onClick: () => props.onPropose(),
          title: "Baut eine Dry-Run-Vorschau — sendet nichts, bis du klickst."
        }, h(Icon, { name: "git-branch", size: 15 }), "Codex-Aufgabe vorschlagen") : null,
        // Lernplan: the wired read-only drill. Opens a preview session (Frage →
        // Antwort → Bewertung-Vorschau); grades/persistence stay in Anki/AnkiDroid.
        props.onReview && props.focusId === "learning" ? h("button", {
          key: "review",
          type: "button",
          className: "mos__tool mos__tool--review",
          onClick: () => props.onReview(),
          title: "Karten üben (Vorschau) — Bewertung & Speicherung in Anki/AnkiDroid."
        }, h(Icon, { name: "play", size: 15 }), "Lernen · Drill") : null,
        // L-3: the Lern-Coach — Klausur-Countdown, Feynman (Jarvis-graded) und
        // Prüfungsplan-Vorschlag (gated). Read + propose-only; kein Anki-Write.
        props.onCoach && props.focusId === "learning" ? h("button", {
          key: "coach",
          type: "button",
          className: "mos__tool mos__tool--coach",
          onClick: () => props.onCoach(),
          title: "Countdown, Feynman (von Jarvis bewertet) und Lernplan-Vorschlag (gated)."
        }, h(Icon, { name: "graduation-cap", size: 15 }), "Lern-Coach") : null,
        // „Lernmodus starten" — öffnet die private Lernplattform (Foliencoach) in
        // einem neuen Tab. Nur im Lernplan-Fokus, neben Drill und Lern-Coach.
        props.focusId === "learning" ? h(LernmodusLaunch, { key: "lernmodus" }) : null,
        LENS_TOOLS.map((tl) => h("button", { key: tl.label, type: "button", className: "mos__tool", title: NOT_WIRED }, h(Icon, { name: tl.icon, size: 15 }), tl.label))
      )
    );
  }
  function berlinTimeFromIso(value) {
    if (!value || /^\d{4}-\d{2}-\d{2}$/.test(value)) return "ganztägig";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }
  function berlinDayFromIso(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      weekday: "short",
      day: "2-digit",
      month: "2-digit"
    }).format(date);
  }
  function timelinePeriod(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "morgen";
    const hour = Number(new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      hour12: false
    }).format(date));
    if (hour < 12) return "morgen";
    if (hour < 18) return "mittag";
    return "abend";
  }
  function realTimelineEvents(byId) {
    const sources = [byId.today, byId.kalender].filter(Boolean);
    const seen = /* @__PURE__ */ new Set();
    const events = [];
    sources.forEach((module) => {
      const rows = Array.isArray(module._rows) ? module._rows : [];
      rows.forEach((row, index) => {
        if (!row || !row.startsAt) return;
        const key = [row.startsAt, row.title, row.workspace].join("|");
        if (seen.has(key)) return;
        seen.add(key);
        const company = row.workspace === "company_signal";
        events.push({
          id: "calendar-" + String(row.startsAt) + "-" + index + "-" + (company ? "company" : "private"),
          period: timelinePeriod(row.startsAt),
          time: berlinTimeFromIso(row.startsAt),
          end: row.endsAt ? berlinTimeFromIso(row.endsAt) : "—",
          day: berlinDayFromIso(row.startsAt),
          title: row.title || "(ohne Titel)",
          sub: row.sub || (company ? "Firma-Signal · nur lesen" : "Privat"),
          icon: company ? "building-2" : "calendar-days",
          accent: company ? "neutral" : "cyan",
          moduleId: "kalender",
          startsAt: row.startsAt
        });
      });
    });
    return events.sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt))).slice(0, 24);
  }
  function TimelineCard(props) {
    const e = props.event;
    const m = props.module;
    return h(
      "button",
      {
        type: "button",
        className: "mos__tl-card mos--" + e.accent + (props.active ? " is-active" : ""),
        "aria-current": props.active ? "true" : void 0,
        "aria-label": e.title + " öffnen",
        onClick: () => props.onActivate(e.moduleId)
      },
      h("span", { className: "mos__tl-card-icon" }, h(Icon, { name: e.icon, size: 20 })),
      h(
        "span",
        { className: "mos__tl-card-body" },
        h(
          "span",
          { className: "mos__tl-card-top" },
          h("span", { className: "mos__tl-card-title" }, e.title),
          h("span", { className: "mos__tl-card-range" }, [e.day, e.time + (e.end !== "—" ? " – " + e.end : "")].filter(Boolean).join(" · "))
        ),
        h("span", { className: "mos__tl-card-sub" }, e.sub),
        // Keep the rail calm (reference has no pills on rows): only the focused card
        // carries its freshness pip; per-source provenance stays in the focus panel.
        // (No progress bar — there is no per-event completion signal in the read
        // model, so a fixed-width bar would fake a state that doesn't exist.)
        props.active && m ? h(StatePip, { module: m }) : null
      )
    );
  }
  function TimelineAxis(props) {
    const rows = [];
    const events = Array.isArray(props.events) ? props.events : realTimelineEvents(props.byId || {});
    if (!events.length) {
      return h(
        "div",
        { className: "mos__tl-axis mos__tl-axis--empty" },
        h(
          "div",
          { className: "mos__vcd-empty" },
          h(Icon, { name: "calendar-days", size: 18 }),
          h("span", null, "Keine bestätigten Kalenderereignisse in der Projektion."),
          h("small", null, "Es werden keine Beispieltermine eingesetzt.")
        )
      );
    }
    PERIODS.forEach((per) => {
      rows.push(h("div", { key: "p-" + per.id, className: "mos__tl-period" }, h(Icon, { name: per.icon, size: 14 }), per.label));
      events.filter((e) => e.period === per.id).forEach((e) => {
        rows.push(
          h(
            "div",
            { key: e.id, className: "mos__tl-row" },
            h("span", { className: "mos__tl-time" }, e.time),
            h("span", { className: "mos__tl-mark", "aria-hidden": "true" }),
            h(TimelineCard, { event: e, module: props.byId[e.moduleId], active: props.activeEventId === e.id, onActivate: props.onActivate })
          )
        );
      });
    });
    rows.push(h("div", { key: "p-night", className: "mos__tl-period mos__tl-period--last" }, h(Icon, { name: "moon", size: 14 }), "Nacht"));
    return h("div", { className: "mos__tl-axis" }, rows);
  }
  function WhoopRing(props) {
    const m = props.module;
    const live = m && !m._demo && m._state === "fresh" && typeof m._recovery === "number";
    const pct = live ? m._recovery : null;
    const C = 2 * Math.PI * 52;
    const dash = pct != null ? pct / 100 * C : C;
    return h(
      "div",
      { className: "mos__whoop-ring" + (pct == null ? " is-connected" : "") },
      h(
        "svg",
        { viewBox: "0 0 120 120", "aria-hidden": "true" },
        h("circle", { cx: 60, cy: 60, r: 52, className: "mos__whoop-track" }),
        h("circle", { cx: 60, cy: 60, r: 52, className: "mos__whoop-arc", style: { strokeDasharray: dash + " " + C, strokeDashoffset: C * 0.25, transform: "rotate(-90deg)", transformOrigin: "60px 60px" } })
      ),
      h(
        "span",
        { className: "mos__whoop-center" },
        pct != null ? [h("b", { key: "v" }, pct + "%"), h("span", { key: "l" }, "Recovery")] : [h(Icon, { key: "i", name: "heart-pulse", size: 22 }), h("b", { key: "v", className: "mos__whoop-conn" }, "Verbunden"), h("span", { key: "l" }, "WHOOP")]
      )
    );
  }
  function TimelineFocusPanel(props) {
    const e = props.event;
    const byId = props.byId;
    if (!e) {
      return h(
        "aside",
        { className: "mos__tlfocus", "aria-label": "Kalenderstatus" },
        h(
          "div",
          { className: "mos__vcd-empty" },
          h(Icon, { name: "calendar-days", size: 18 }),
          h("span", null, "Kein Termin ausgewählt."),
          h("small", null, "Kalender und Aufgaben bleiben unten vollständig sichtbar.")
        )
      );
    }
    const linked = byId[e.moduleId];
    const cal = byId["kalender"];
    const tasks = byId["tasks"];
    const body = byId["body"];
    const liveSignals = Object.keys(byId).map((k) => byId[k]).filter((m) => m && !m._demo && m.title && m.icon && (m._state === "fresh" || m._state === "stale" || m._state === "partial")).sort((a, b) => (a._state === "fresh" ? -1 : 1) - (b._state === "fresh" ? -1 : 1)).slice(0, 4);
    const calRows = (cal && cal._rows && cal._rows.length ? cal._rows : []).slice(0, 3);
    const topRows = (tasks && tasks._rows && tasks._rows.length ? tasks._rows : []).slice(0, 3);
    return h(
      "aside",
      { className: "mos__tlfocus", "aria-label": "Fokus: " + e.title },
      h(
        "header",
        { className: "mos__tlfocus-head" },
        h("span", { className: "mos__tlfocus-badge mos--" + e.accent }, h(Icon, { name: e.icon, size: 20 })),
        h(
          "span",
          { className: "mos__tlfocus-titles" },
          h("span", { className: "mos__tlfocus-k" }, "Fokus"),
          h("span", { className: "mos__tlfocus-title" }, e.title)
        ),
        linked ? h(StatePip, { module: linked }) : null,
        h("button", { type: "button", className: "mos__iconbtn", "aria-label": "Fokus zurücksetzen", onClick: props.onClose }, h(Icon, { name: "x", size: 18 }))
      ),
      h(
        "div",
        { className: "mos__tlfocus-body" },
        h(
          "div",
          { className: "mos__tlfocus-duo" },
          // Kalender – Heute
          h(
            "section",
            { className: "mos__tlfocus-sec" },
            h(
              "h3",
              { className: "mos__tlfocus-h3" },
              h(Icon, { name: "calendar-days", size: 14 }),
              "Kalender – Heute"
            ),
            calRows.map((r, i) => h(
              "div",
              { key: i, className: "mos__tlfocus-cal" },
              h("span", { className: "mos__tlfocus-cal-time" }, r.value || "—"),
              h(
                "span",
                { className: "mos__tlfocus-cal-body" },
                h("span", { className: "mos__tlfocus-cal-title" }, r.title),
                h("span", { className: "mos__tlfocus-cal-sub" }, r.sub)
              )
            ))
          ),
          // Top 3 Prioritäten
          h(
            "section",
            { className: "mos__tlfocus-sec" },
            h(
              "h3",
              { className: "mos__tlfocus-h3" },
              h(Icon, { name: "list-todo", size: 14 }),
              "Top 3 Prioritäten"
            ),
            topRows.map((r, i) => h(
              "div",
              { key: i, className: "mos__tlfocus-top mos--" + (r.accent || "cyan") },
              h("span", { className: "mos__tlfocus-top-idx" }, String(i + 1)),
              h(
                "span",
                { className: "mos__tlfocus-top-body" },
                h("span", { className: "mos__tlfocus-top-title", title: r.title }, r.title),
                h("span", { className: "mos__tlfocus-top-sub" }, r.sub)
              )
            ))
          )
        ),
        // WHOOP – Körperstatus. When the connector holds no detail values (no token
        // in the plugin context) we do NOT render four dead "—" tiles that dominate
        // the fold — we show the honest connection ring plus one compact note naming
        // what the authorized connector would provide. If real values ever arrive
        // (body live + numeric stats) the 2×2 value grid renders instead. Nothing
        // is ever fabricated.
        function() {
          const bodyLive = body && !body._demo && body._state === "fresh";
          const stats = [
            { k: "Schlaf", icon: "moon", v: bodyLive ? body._sleep : null },
            { k: "HRV", icon: "activity", v: bodyLive ? body._hrv : null },
            { k: "Ruhepuls", icon: "heart-pulse", v: bodyLive ? body._rhr : null },
            { k: "Belastung", icon: "zap", v: bodyLive ? body._strain : null }
          ];
          const hasVals = stats.some((s) => s.v != null);
          return h(
            "section",
            { className: "mos__tlfocus-sec mos__tlfocus-whoop" },
            h(
              "h3",
              { className: "mos__tlfocus-h3" },
              h(Icon, { name: "heart-pulse", size: 14 }),
              "WHOOP – Körperstatus",
              body ? h(StatePip, { module: body }) : null
            ),
            h(
              "div",
              { className: "mos__tlfocus-whoop-row" + (hasVals ? "" : " is-compact") },
              h(WhoopRing, { module: body }),
              hasVals ? h(
                "div",
                { className: "mos__tlfocus-stats" },
                stats.map((s) => h(
                  "div",
                  { key: s.k, className: "mos__tlfocus-stat" },
                  h("span", { className: "mos__tlfocus-stat-k" }, h(Icon, { name: s.icon, size: 12 }), s.k),
                  h("span", { className: "mos__tlfocus-stat-v" }, s.v)
                ))
              ) : h(
                "div",
                { className: "mos__tlfocus-whoop-empty" },
                h("span", { className: "mos__tlfocus-whoop-empty-title" }, "Keine Detailwerte im Plugin-Kontext"),
                h(
                  "span",
                  { className: "mos__tlfocus-whoop-empty-note" },
                  "Schlaf · HRV · Ruhepuls · Belastung nur über den autorisierten WHOOP-Connector."
                )
              )
            )
          );
        }(),
        // Live-Signale — real read-model modules only (honest state + freshness)
        liveSignals.length ? h(
          "section",
          { className: "mos__tlfocus-sec mos__tlfocus-signals" },
          h(
            "h3",
            { className: "mos__tlfocus-h3" },
            h(Icon, { name: "activity", size: 14 }),
            "Live-Signale",
            h("span", { className: "mos__tlfocus-sig-count" }, liveSignals.length + " aktiv")
          ),
          h(
            "div",
            { className: "mos__tlfocus-sig-grid" },
            liveSignals.map((m) => {
              const fresh = freshnessLabel(m._observedAt);
              const sm = STATE_META[m._state] || STATE_META.loading;
              return h(
                "div",
                { key: m.id, className: "mos__tlfocus-sig mos--" + m.accent },
                h("span", { className: "mos__tlfocus-sig-icon" }, h(Icon, { name: m.icon, size: 16 })),
                h(
                  "span",
                  { className: "mos__tlfocus-sig-body" },
                  h("span", { className: "mos__tlfocus-sig-title" }, m.title),
                  h(
                    "span",
                    { className: "mos__tlfocus-sig-meta" },
                    h("span", { className: "mos__tlfocus-sig-dot mos__tlfocus-sig-dot--" + sm.tone, "aria-hidden": "true" }),
                    m._metric != null && m._metric !== "—" ? h("b", null, m._metric) : null,
                    fresh ? h("span", { className: "mos__tlfocus-sig-age" }, fresh) : sm.label
                  )
                )
              );
            })
          )
        ) : null
      )
    );
  }
  function TimelineScene(props) {
    const events = realTimelineEvents(props.byId || {});
    const focusEvent = events.find((e) => e.moduleId === props.focusId) || events[0] || null;
    const now = /* @__PURE__ */ new Date();
    const today = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      weekday: "long",
      day: "2-digit",
      month: "long"
    }).format(now);
    return h(
      "div",
      { className: "mos__timeline" },
      h(
        "div",
        { className: "mos__tl-col" },
        h(
          "div",
          { className: "mos__tl-head" },
          h("span", { className: "mos__tl-head-icon" }, h(Icon, { name: "waypoints", size: 18 })),
          h(
            "span",
            { className: "mos__tl-head-titles" },
            h("span", { className: "mos__tl-head-title" }, "Living Timeline"),
            h("span", { className: "mos__tl-head-sub" }, today + " · echte Kalender-Projektion")
          )
        ),
        h("div", { className: "mos__tl-scroll" }, h(TimelineAxis, {
          byId: props.byId,
          events,
          activeEventId: focusEvent ? focusEvent.id : null,
          onActivate: props.onActivate
        }))
      ),
      h(TimelineFocusPanel, { event: focusEvent, byId: props.byId, onClose: props.onClose })
    );
  }
  function SceneSwitcher(props) {
    return h(
      "div",
      { className: "mos__scenes", role: "tablist", "aria-label": "Ansicht wechseln" },
      [
        { id: "cockpit", icon: "layout-dashboard", label: "Cockpit" },
        { id: "constellation", icon: "orbit", label: "Konstellation" },
        { id: "timeline", icon: "waypoints", label: "Timeline" }
      ].map((s) => h(
        "button",
        {
          key: s.id,
          type: "button",
          role: "tab",
          className: "mos__scene-tab",
          "aria-selected": props.scene === s.id ? "true" : "false",
          "aria-pressed": props.scene === s.id ? "true" : "false",
          onClick: () => props.onScene(s.id)
        },
        h(Icon, { name: s.icon, size: 15 }),
        h("span", null, s.label)
      ))
    );
  }
  function TopBar(props) {
    const [now, setNow] = useState(() => /* @__PURE__ */ new Date());
    useEffect(() => {
      const timer = window.setInterval(() => setNow(/* @__PURE__ */ new Date()), 3e4);
      return () => window.clearInterval(timer);
    }, []);
    const berlinTime = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit"
    }).format(now);
    const berlinDate = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      weekday: "short",
      day: "2-digit",
      month: "2-digit"
    }).format(now);
    return h(
      "header",
      { className: "mos__topbar" },
      h(
        "div",
        { className: "mos__identity" },
        h("span", { className: "mos__avatar", "aria-hidden": "true" }, "M"),
        h(
          "span",
          null,
          h("span", { className: "mos__identity-name" }, "Mikael"),
          h("span", { className: "mos__identity-sub" }, "Persönliches Command Center")
        )
      ),
      h("div", { className: "mos__wordmark" }, "MIKAEL OS"),
      h(
        "div",
        { className: "mos__topright" },
        props.onBack ? h(
          "button",
          {
            type: "button",
            className: "mos__topback",
            onClick: props.onBack,
            "aria-label": "Zurück zum Cockpit"
          },
          h(Icon, { name: "chevron-left", size: 16 }),
          "Cockpit"
        ) : h(SceneSwitcher, { scene: props.scene, onScene: props.onScene }),
        function() {
          const ls = props.loadState;
          const liveN = props.liveCount || 0;
          if (ls === "loading") {
            return h(
              "span",
              { className: "mos__concept mos__concept--loading", title: "Read-Modelle werden geladen …" },
              h(Icon, { name: "loader", size: 14 }),
              "Lädt Read-Modelle …"
            );
          }
          if (liveN > 0) {
            return h(
              "span",
              {
                className: "mos__concept mos__concept--live",
                title: liveN + " Module projizieren echte Read-Modelle mit Herkunft und Freshness."
              },
              h(Icon, { name: "activity", size: 14 }),
              liveN + " Quellen live"
            );
          }
          return h(
            "span",
            { className: "mos__concept", title: ls === "offline" ? "Read-Modelle nicht erreichbar." : "Noch keine Live-Quelle bestätigt." },
            h(Icon, { name: "unplug", size: 14 }),
            ls === "offline" ? "Quellen offline" : "Keine Live-Quelle"
          );
        }(),
        h(
          "span",
          { className: "mos__topchip mos__topchip-time" },
          h("b", null, berlinTime),
          h("span", null, berlinDate + " · Berlin")
        ),
        h("button", { type: "button", className: "mos__shieldbtn", "aria-label": "Privatsphäre & Berechtigungen" }, h(Icon, { name: "shield-check", size: 20 }))
      )
    );
  }
  function WorkspaceSwitcher(props) {
    return h(
      "div",
      { className: "mos__workspace", role: "group", "aria-label": "Workspace wechseln" },
      h("span", { className: "mos__workspace-label" }, "Workspace"),
      WORKSPACES.map((w) => h(
        "button",
        {
          key: w.id,
          type: "button",
          className: "mos__ws-tab",
          "aria-pressed": props.active === w.id ? "true" : "false",
          onClick: () => props.onChange(w.id)
        },
        w.label
      ))
    );
  }
  function StateRail(props) {
    return h(
      "div",
      { className: "mos__states", role: "list", "aria-label": "Jarvis-Zustand" },
      STATES.map((s, i) => h(
        "span",
        {
          key: s.id,
          className: "mos__state",
          role: "listitem",
          "data-active": i === props.activeIndex ? "true" : "false",
          "data-passed": i < props.activeIndex ? "true" : "false",
          "data-tone": s.tone
        },
        h("span", { className: "mos__state-dot", "aria-hidden": "true" }),
        s.label
      ))
    );
  }
  function ProposeStatusLine(props) {
    const meta = PROPOSE_META[props.phase] || PROPOSE_META.error;
    const spinning = props.phase === "submitting" || props.phase === "loading";
    return h(
      "div",
      { className: "mos__pp-status mos__pp-status--" + meta.tone, role: "status", "aria-live": "polite" },
      h("span", { className: "mos__pp-status-icon" + (spinning ? " is-spin" : "") }, h(Icon, { name: meta.icon, size: 16 })),
      h("span", { className: "mos__pp-status-label" }, meta.label)
    );
  }
  function ProposeFlow(props) {
    const st = props.state;
    if (!st) return null;
    const phase = st.phase;
    const prof = proposeProfile(st);
    const meta = PROPOSE_META[phase] || PROPOSE_META.error;
    const cp = st.controlPlane || st.preview && st.preview.controlPlane;
    const reachable = cp ? cp.reachable : null;
    const plan = st.preview && st.preview.plan;
    const gate = st.preview && st.preview.predictedGate || st.gate;
    const isTerminal = !!PROPOSE_TERMINAL[phase];
    const canSend = phase === "preview" && (st.objective || "").trim().length > 0;
    const body = [];
    body.push(h(
      "div",
      { key: "banner", className: "mos__pp-honest" },
      h(Icon, { name: "lock", size: 13 }),
      "Propose-only — das Plugin führt nicht aus. Dein Gate entscheidet (ALLOW / DENY / Freigabe)."
    ));
    body.push(h(ProposeStatusLine, { key: "status", phase }));
    if (phase === "compose" || phase === "loading") {
      body.push(h(
        "label",
        { key: "compose", className: "mos__pp-field" },
        h("span", { className: "mos__pp-field-k" }, prof.fieldLabel),
        h("textarea", {
          className: "mos__pp-textarea",
          rows: 3,
          placeholder: prof.placeholder,
          value: st.objective || "",
          disabled: phase === "loading",
          onChange: (e) => props.onObjective(e.target.value),
          autoFocus: true
        }),
        h(
          "span",
          { className: "mos__pp-scope" },
          h(Icon, { name: "lock", size: 11 }),
          prof.scopeHint
        )
      ));
    }
    if (phase === "preview" && plan) {
      body.push(h(
        "div",
        { key: "preview", className: "mos__pp-preview" },
        h(
          "div",
          { className: "mos__pp-line" },
          h("span", { className: "mos__pp-line-k" }, "Das wird vorgeschlagen"),
          h("span", { className: "mos__pp-line-v mos__pp-objective" }, plan.objective)
        ),
        h(
          "div",
          { className: "mos__pp-grid" },
          h(
            "div",
            { className: "mos__pp-cell" },
            h("span", { className: "mos__pp-cell-k" }, h(Icon, { name: "code-xml", size: 12 }), "Workspace"),
            h("span", { className: "mos__pp-cell-v" }, plan.workspaceLabel)
          ),
          h(
            "div",
            { className: "mos__pp-cell" },
            h("span", { className: "mos__pp-cell-k" }, h(Icon, { name: "git-branch", size: 12 }), "Job-Typ"),
            h("span", { className: "mos__pp-cell-v" }, plan.jobType)
          ),
          h(
            "div",
            { className: "mos__pp-cell mos__pp-cell--wide" },
            // `clock` (pending), NOT shield-check — a check-mark here would falsely
            // read as "erledigt", while the proposal is still open.
            h("span", { className: "mos__pp-cell-k" }, h(Icon, { name: "clock", size: 12 }), "Braucht Freigabe"),
            h("span", { className: "mos__pp-cell-v mos__pp-gate" }, gate && gate.human || plan.gateHuman)
          )
        ),
        h(
          "div",
          { className: "mos__pp-caps" },
          (plan.capabilities || []).map((c) => h("span", { key: c, className: "mos__pp-cap" }, c))
        ),
        h(
          "div",
          { className: "mos__pp-cp" + (reachable ? " is-ok" : " is-pending") },
          h(Icon, { name: reachable ? "shield-check" : "triangle-alert", size: 12 }),
          reachable ? "Gate-Anbindung bereit (Control-Plane erreichbar · Loopback-Auth)" : "Freigabe-Anbindung: Auth ausstehend (Control-Plane nicht erreichbar)"
        )
      ));
    }
    if (isTerminal || phase === "waiting_approval" || phase === "submitting") {
      if (st.objective) {
        body.push(h(
          "div",
          { key: "obj", className: "mos__pp-echo" },
          h(Icon, { name: "git-branch", size: 12 }),
          st.objective
        ));
      }
      if (st.cardId) {
        body.push(h(
          "div",
          { key: "card", className: "mos__pp-receipt" },
          h(Icon, { name: meta.icon, size: 12 }),
          "Approval-Card ",
          h("b", null, st.cardId)
        ));
      }
      if (st.note) body.push(h("p", { key: "note", className: "mos__pp-note" }, st.note));
      if (phase === "denied" || phase === "error" || phase === "auth_pending") {
        body.push(h(
          "p",
          { key: "hint", className: "mos__pp-note mos__pp-note--muted" },
          "Kein Gate umgangen — dieser Zustand kommt direkt von deinem Gate bzw. der Anbindung."
        ));
      }
    }
    if (st.error && !st.note) body.push(h("p", { key: "err", className: "mos__pp-note" }, st.error));
    const actions = [];
    if (phase === "compose" || phase === "loading") {
      actions.push(h("button", { key: "cancel", type: "button", className: "mos__pp-btn", onClick: props.onClose }, "Abbrechen"));
      actions.push(h("button", {
        key: "prev",
        type: "button",
        className: "mos__pp-btn mos__pp-btn--primary",
        disabled: phase === "loading" || !(st.objective || "").trim(),
        onClick: () => props.onPreview(st.objective)
      }, h(Icon, { name: "flask-conical", size: 15 }), "Vorschau erstellen"));
    } else if (phase === "preview") {
      actions.push(h("button", { key: "back", type: "button", className: "mos__pp-btn", onClick: () => props.onPreview(null, true) }, "Zurück"));
      actions.push(h("button", {
        key: "send",
        type: "button",
        className: "mos__pp-btn mos__pp-btn--send",
        disabled: !canSend,
        title: "Feuert live an dein Gate — erst dieser Klick sendet etwas.",
        onClick: () => props.onSend(st.objective)
      }, h(Icon, { name: "send-horizontal", size: 15 }), "An Gate senden"));
    } else if (phase === "waiting_approval") {
      actions.push(h("button", { key: "close", type: "button", className: "mos__pp-btn", onClick: props.onClose }, "Schließen"));
      actions.push(h("button", {
        key: "check",
        type: "button",
        className: "mos__pp-btn mos__pp-btn--primary",
        onClick: () => props.onPoll(st)
      }, h(Icon, { name: "loader", size: 15 }), "Status prüfen"));
    } else if (phase === "submitting" || phase === "loading") ;
    else {
      actions.push(h("button", { key: "done", type: "button", className: "mos__pp-btn mos__pp-btn--primary", onClick: props.onClose }, "Schließen"));
    }
    return h(
      "div",
      { className: "mos__pp-scrim", onClick: props.onClose },
      h(
        "section",
        {
          className: "mos__pp mos__pp--" + meta.tone,
          // The dialog NAME carries the live state so a screen reader announces the
          // real phase (Entwurf / Wartet auf Freigabe / Freigegeben / Abgelehnt …),
          // not a frozen "…vorschlagen" (WCAG 4.1.2 Name/Role/Value, 2.4.6).
          role: "dialog",
          "aria-modal": "true",
          "aria-label": prof.title + " · " + meta.label,
          onClick: (e) => e.stopPropagation()
        },
        h(
          "header",
          { className: "mos__pp-head" },
          // Badge glyph tracks the lifecycle icon (form, not colour alone).
          h("span", { className: "mos__pp-badge" }, h(Icon, { name: meta.icon, size: 18 })),
          h(
            "span",
            { className: "mos__pp-titles" },
            h("span", { className: "mos__pp-title" }, prof.title),
            h("span", { className: "mos__pp-sub" }, prof.subKind + " · " + meta.label)
          ),
          h("button", { type: "button", className: "mos__iconbtn mos__iconbtn--close", "aria-label": "Schließen", onClick: props.onClose }, h(Icon, { name: "x", size: 18 }))
        ),
        h("div", { className: "mos__pp-body" }, body),
        h("footer", { className: "mos__pp-foot" }, actions)
      )
    );
  }
  const REVIEW_RATING_FALLBACK = [
    { key: "again", label: "Nochmal", accent: "red", icon: "rotate-ccw" },
    { key: "hard", label: "Schwer", accent: "amber", icon: "hourglass" },
    { key: "good", label: "Gut", accent: "emerald", icon: "circle-check-big" },
    { key: "easy", label: "Einfach", accent: "cyan", icon: "fast-forward" }
  ];
  const REVIEW_HONEST = "Vorschau/Drill — Bewertung & Speicherung in Anki / AnkiDroid. Hier wird nichts gespeichert.";
  function ReviewRail(props) {
    const d = props.data || {};
    const retention = d.retentionPct || (d.retention != null ? Math.round(d.retention * 100) + " %" : "—");
    const streak = d.streak != null ? d.streak : null;
    const learned = d.learnedToday != null ? d.learnedToday : null;
    const items = [
      { icon: "target", accent: "violet", k: "Retention", v: retention, sub: "30 T" },
      { icon: "flame", accent: "amber", k: "Streak", v: streak != null ? streak + " T" : "—", sub: "in Folge" },
      { icon: "clock", accent: "cyan", k: "Heute gelernt", v: learned != null ? String(learned) : "—", sub: "Reviews" }
    ];
    return h(
      "aside",
      { className: "mos__rv-rail", "aria-label": "Lern-Kennzahlen" },
      items.map((it) => h(
        "div",
        { key: it.k, className: "mos__rv-stat mos--" + it.accent },
        h("span", { className: "mos__rv-stat-icon" }, h(Icon, { name: it.icon, size: 18 })),
        h("span", { className: "mos__rv-stat-v" }, it.v),
        h("span", { className: "mos__rv-stat-k" }, it.k),
        h("span", { className: "mos__rv-stat-sub" }, it.sub)
      ))
    );
  }
  function ReviewRatingRow(props) {
    const ratings = props.data && props.data.ratings && props.data.ratings.length ? props.data.ratings : REVIEW_RATING_FALLBACK;
    const card = props.card || {};
    const previews = card.preview || null;
    return h(
      "div",
      { className: "mos__rv-ratings", role: "group", "aria-label": "Bewertung (Vorschau, nicht gespeichert)" },
      ratings.map((r, i) => {
        const iv = previews && previews[r.key] ? previews[r.key] : null;
        return h(
          "button",
          {
            key: r.key,
            type: "button",
            className: "mos__rv-rate mos--" + r.accent,
            onClick: () => props.onRate(r.key),
            "aria-label": r.label + (iv ? " · Vorschau " + iv : "") + " (Taste " + (i + 1) + ")"
          },
          h(
            "span",
            { className: "mos__rv-rate-top" },
            h("span", { className: "mos__rv-rate-icon" }, h(Icon, { name: r.icon, size: 16 })),
            h("span", { className: "mos__rv-rate-label" }, r.label),
            h("span", { className: "mos__rv-rate-key", "aria-hidden": "true" }, String(i + 1))
          ),
          h(
            "span",
            { className: "mos__rv-rate-iv" },
            h("span", { className: "mos__rv-rate-iv-k" }, "Vorschau"),
            h("span", { className: "mos__rv-rate-iv-v" }, iv || "—")
          )
        );
      })
    );
  }
  function ReviewCard(props) {
    const card = props.card;
    const flipped = props.flipped;
    const reduce = prefersReducedMotion();
    return h(
      "div",
      { className: "mos__rv-card mos--violet" + (flipped ? " is-flipped" : "") + (reduce ? " is-static" : "") },
      h(
        "div",
        { className: "mos__rv-card-head" },
        h("span", { className: "mos__rv-card-deck" }, h(Icon, { name: "graduation-cap", size: 16 }), card.deck || "Deck"),
        h(
          "span",
          { className: "mos__rv-card-face" + (flipped ? " is-back" : "") },
          flipped ? "Antwort" : "Frage"
        )
      ),
      h("div", { className: "mos__rv-card-q" }, card.front),
      flipped ? h(
        "div",
        { className: "mos__rv-card-a" },
        h("span", { className: "mos__rv-card-a-k" }, "Antwort"),
        h("p", { className: "mos__rv-card-a-text" }, card.back)
      ) : null,
      card.intervalCurrent ? h(
        "div",
        { className: "mos__rv-card-ivl" },
        h(Icon, { name: "clock", size: 12 }),
        "Aktuelles Intervall: ",
        h("b", null, card.intervalCurrent)
      ) : null,
      flipped ? h(ReviewRatingRow, { data: props.data, card, onRate: props.onRate }) : h(
        "button",
        { type: "button", className: "mos__rv-flip", onClick: props.onFlip, autoFocus: true },
        h(Icon, { name: "eye", size: 18 }),
        "Antwort zeigen",
        h("span", { className: "mos__rv-flip-key", "aria-hidden": "true" }, "Leertaste")
      )
    );
  }
  function ReviewBodyReady(props) {
    const st = props.state;
    const d = st.data || {};
    const cards = d.cards || [];
    const card = cards[st.index] || cards[0];
    const total = cards.length;
    const pct = total ? Math.round(st.index / total * 100) : 0;
    return h(
      "div",
      { className: "mos__rv-stage" },
      h(
        "div",
        { className: "mos__rv-main" },
        // progress
        h(
          "div",
          { className: "mos__rv-progress" },
          h(
            "span",
            { className: "mos__rv-progress-idx" },
            h(Icon, { name: "list", size: 15 }),
            st.index + 1 + " / " + total
          ),
          h(
            "span",
            { className: "mos__rv-progress-bar" },
            h("span", { className: "mos__rv-progress-fill", style: { width: pct + "%" } })
          ),
          h("span", { className: "mos__rv-progress-done" }, st.reviewed + " geübt")
        ),
        h(ReviewCard, { card, flipped: st.flipped, data: d, onFlip: props.onFlip, onRate: props.onRate }),
        // honest, always-on: nothing is persisted here
        h(
          "div",
          { className: "mos__rv-honest" },
          h(Icon, { name: "flask-conical", size: 13 }),
          h(
            "span",
            null,
            d.honest || REVIEW_HONEST,
            d.previewNote ? h("span", { className: "mos__rv-honest-src" }, " · " + d.previewNote) : null
          )
        )
      ),
      h(ReviewRail, { data: d })
    );
  }
  function ReviewBodyState(props) {
    const st = props.state;
    const d = st.data || {};
    const map = {
      loading: { icon: "loader", tone: "muted", title: "Lädt Drill …", note: "Lese die Anki-Collection (read-only) …", spin: true },
      empty: {
        icon: "graduation-cap",
        tone: "muted",
        title: d.reason === "no_due" ? "Keine fälligen Karten" : "Noch nicht synchronisiert",
        note: d.note || "Sobald das erste Gerät synchronisiert, erscheinen hier fällige Karten."
      },
      unavailable: {
        icon: "unplug",
        tone: "red",
        title: d.summary || "Nicht lesbar",
        note: d.note || "Anki-Collection nicht lesbar. Read-only — nichts wird verändert."
      },
      error: {
        icon: "triangle-alert",
        tone: "red",
        title: "Drill nicht erreichbar",
        note: "Die Lern-Session konnte nicht geladen werden. Es wurde nichts verändert."
      },
      done: {
        icon: "party-popper",
        tone: "verified",
        title: "Drill beendet",
        note: "Nichts wurde gespeichert — die echte Bewertung machst du in Anki / AnkiDroid."
      }
    };
    const m = map[st.phase] || map.loading;
    return h(
      "div",
      { className: "mos__rv-panel mos--" + m.tone },
      h("span", { className: "mos__rv-panel-icon" + (m.spin ? " is-spin" : "") }, h(Icon, { name: m.icon, size: 30 })),
      h("span", { className: "mos__rv-panel-title" }, st.phase === "done" ? "Drill beendet · " + st.reviewed + " Karten durchgesehen" : m.title),
      h("span", { className: "mos__rv-panel-note" }, m.note),
      st.phase === "done" ? h("span", { className: "mos__rv-panel-honest" }, h(Icon, { name: "flask-conical", size: 12 }), REVIEW_HONEST) : null,
      st.phase === "done" ? h(
        "div",
        { className: "mos__rv-panel-actions" },
        h(
          "button",
          { type: "button", className: "mos__rv-btn mos__rv-btn--primary", onClick: props.onRestart },
          h(Icon, { name: "rotate-ccw", size: 15 }),
          "Nochmal drillen"
        ),
        h("button", { type: "button", className: "mos__rv-btn", onClick: props.onClose }, "Schließen")
      ) : st.phase === "empty" || st.phase === "unavailable" || st.phase === "error" ? h(
        "div",
        { className: "mos__rv-panel-actions" },
        h("button", { type: "button", className: "mos__rv-btn", onClick: props.onClose }, "Schließen")
      ) : null
    );
  }
  function ReviewSurface(props) {
    const st = props.state;
    useEffect(() => {
      if (!st) return void 0;
      function onKey(e) {
        const k = e.key;
        if (k === "Escape") {
          e.preventDefault();
          props.onClose();
          return;
        }
        if (st.phase !== "ready") return;
        const tag = e.target && e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (!st.flipped) {
          if (k === " " || k === "Spacebar" || k === "Enter") {
            e.preventDefault();
            props.onFlip();
          }
          return;
        }
        if (k >= "1" && k <= "4") {
          e.preventDefault();
          props.onRate(["again", "hard", "good", "easy"][parseInt(k, 10) - 1]);
        }
      }
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [st, props.onFlip, props.onRate, props.onClose]);
    if (!st) return null;
    const d = st.data || {};
    const previewSrc = d.previewSource || "unavailable";
    const srcLabel = { "py-fsrs": "py-fsrs · Vorschau", "anki-cards.data": "cards.data · Intervall", "unavailable": "Vorschau n/a" }[previewSrc] || previewSrc;
    return h(
      "div",
      { className: "mos__rv-scrim", onClick: props.onClose },
      h(
        "section",
        {
          className: "mos__rv",
          role: "dialog",
          "aria-modal": "true",
          "aria-label": "Lernen · Drill (Vorschau, keine Speicherung)",
          onClick: (e) => e.stopPropagation()
        },
        h(
          "header",
          { className: "mos__rv-head" },
          h("span", { className: "mos__rv-head-badge" }, h(Icon, { name: "graduation-cap", size: 18 })),
          h(
            "span",
            { className: "mos__rv-head-titles" },
            h("span", { className: "mos__rv-head-title" }, "Lernen · Drill"),
            h("span", { className: "mos__rv-head-sub" }, "Spaced Repetition · Anki (read-only)")
          ),
          h(
            "span",
            { className: "mos__pip mos__pip--konzept mos__rv-head-pip", title: d.note || srcLabel },
            h(Icon, { name: previewSrc === "py-fsrs" ? "flask-conical" : "shield-check", size: 11 }),
            srcLabel
          ),
          h(
            "button",
            { type: "button", className: "mos__iconbtn mos__iconbtn--close", "aria-label": "Drill schließen", onClick: props.onClose },
            h(Icon, { name: "x", size: 18 })
          )
        ),
        st.phase === "ready" ? h(ReviewBodyReady, { state: st, onFlip: props.onFlip, onRate: props.onRate }) : h(ReviewBodyState, { state: st, onRestart: props.onRestart, onClose: props.onClose })
      )
    );
  }
  const COACH_TABS = [
    { id: "countdown", icon: "calendar-clock", label: "Klausur-Countdown" },
    { id: "feynman", icon: "message-square", label: "Feynman" },
    { id: "plan", icon: "list-todo", label: "Lernplan" },
    { id: "material", icon: "file-plus", label: "PDFs" }
  ];
  const COACH_METHODS_FALLBACK = [
    { key: "priming", icon: "lightbulb", title: "Priming", line: "Erst aus dem Kopf: Was weißt du schon?" },
    { key: "active-recall", icon: "brain", title: "Active Recall", line: "Abrufen statt wiederlesen (Testing-Effekt)." },
    { key: "spaced", icon: "clock", title: "Spaced Repetition", line: "≥3 Abrufe pro Thema vor der Klausur." }
  ];
  const COACH_JARVIS_NOTE = "Bewertung kommt von Jarvis (Brain-Kette) — nicht vom Plugin, nichts wird gespeichert.";
  function studyObjective(ex) {
    if (!ex) return "";
    const themen = ex.themen && ex.themen.length ? " Themen: " + ex.themen.join(", ") + "." : "";
    const inN = ex.daysLeft != null && ex.daysLeft >= 0 ? " (in " + ex.daysLeft + " Tagen)" : "";
    return "Erstelle einen Spaced-Repetition-Lernplan bis zur Klausur " + ex.fach + " am " + ex.datum + inN + "." + themen + " Plane rückwärts vom Klausurdatum, mindestens 3 Abrufe pro Thema, mit Active-Recall- und Feynman-Runden und täglichen Kartenzielen aus den Anki-Fälligkeiten. Nur Studium/privat.";
  }
  function CoachMethods(props) {
    const methods = props.methods && props.methods.length ? props.methods : COACH_METHODS_FALLBACK;
    return h(
      "div",
      { className: "mos__co-methods", "aria-label": "Lernmethoden" },
      h("span", { className: "mos__co-methods-k" }, h(Icon, { name: "sparkles", size: 12 }), "Methodik"),
      methods.map((m) => h(
        "span",
        { key: m.key, className: "mos__co-method", title: m.line },
        h(Icon, { name: m.icon, size: 12 }),
        m.title
      ))
    );
  }
  function CoachJarvisPip(props) {
    const j = props.jarvis || {};
    const ready = !!j.ready;
    return h(
      "span",
      { className: "mos__co-jpip mos--" + (ready ? "verified" : "amber"), title: j.note || "" },
      h(Icon, { name: ready ? "sparkles" : "triangle-alert", size: 11 }),
      ready ? "Jarvis bereit" : "Jarvis-Bewertung ausstehend"
    );
  }
  function CoachCountdown(props) {
    const st = props.state;
    const plan = st.plan || {};
    const exams = (plan.exams || []).filter((e) => e && e.valid !== false);
    if (st.planState === "loading") {
      return h(
        "div",
        { className: "mos__co-panel mos--muted" },
        h("span", { className: "mos__co-panel-icon is-spin" }, h(Icon, { name: "loader", size: 28 })),
        h("span", { className: "mos__co-panel-title" }, "Lade Countdown …"),
        h("span", { className: "mos__co-panel-note" }, "exams.json × Anki (read-only)")
      );
    }
    if (!exams.length) {
      return h(
        "div",
        { className: "mos__co-panel mos--muted" },
        h("span", { className: "mos__co-panel-icon" }, h(Icon, { name: "calendar-clock", size: 28 })),
        h("span", { className: "mos__co-panel-title" }, plan.summary || "Keine Klausurtermine"),
        h("span", { className: "mos__co-panel-note" }, plan.note || "Lege Klausurtermine in exams.json an (Fach · Datum · Themen · optional Anki-Deck).")
      );
    }
    return h(
      "div",
      { className: "mos__co-scroll" },
      h(
        "div",
        { className: "mos__co-exams" },
        exams.map((e) => {
          const tone = { today: "red", critical: "red", tight: "amber", ok: "violet", past: "muted" }[e.tier] || "violet";
          return h(
            "div",
            { key: e.fach + e.datum, className: "mos__co-exam mos--" + tone },
            h(
              "div",
              { className: "mos__co-exam-top" },
              h("span", { className: "mos__co-exam-fach" }, e.fach),
              h("span", { className: "mos__co-exam-tier mos--" + tone }, e.tierLabel)
            ),
            h(
              "div",
              { className: "mos__co-exam-days" },
              h("span", { className: "mos__co-exam-n" }, e.daysLeft === 0 ? "heute" : e.daysLeft < 0 ? "vorbei" : e.daysLeft),
              e.daysLeft > 0 ? h("span", { className: "mos__co-exam-unit" }, "Tage") : null
            ),
            h(
              "div",
              { className: "mos__co-exam-meta" },
              h("span", { className: "mos__co-exam-date" }, h(Icon, { name: "calendar-days", size: 12 }), e.datum),
              h("span", { className: "mos__co-exam-goal" }, h(Icon, { name: "target", size: 12 }), e.goalText)
            ),
            e.feynmanHint ? h("div", { className: "mos__co-exam-hint" }, h(Icon, { name: "message-square", size: 12 }), e.feynmanHint) : e.themenCount ? h(
              "div",
              { className: "mos__co-exam-hint mos--soft" },
              h(Icon, { name: "book-open", size: 12 }),
              e.themenCount + " Themen"
            ) : null
          );
        })
      ),
      h(CoachMethods, { methods: plan.methods }),
      h(
        "div",
        { className: "mos__co-honest" },
        h(Icon, { name: "eye", size: 13 }),
        h("span", null, plan.note || "Countdown aus exams.json (read-only) × Anki-Fälligkeiten. Tagesziel ehrlich „folgt“, wenn die Collection leer ist. Anki bleibt die SR-Wahrheit — hier wird nichts geschrieben.")
      )
    );
  }
  function CoachFeynman(props) {
    const st = props.state;
    const fey = st.fey || {};
    const setup = fey.setup || {};
    const result = fey.result || null;
    const jarvis = result && result.jarvis || setup.jarvis || {};
    const concept = setup.concept || "";
    const busy = fey.phase === "evaluating";
    return h(
      "div",
      { className: "mos__co-scroll" },
      // method + priming line (mirrors lern-priming / lern-feynman)
      h(
        "div",
        { className: "mos__co-fey-method" },
        h(Icon, { name: "message-square", size: 14 }),
        h("span", null, setup.method && setup.method.hint || "Erklär frei, ohne Fachjargon; wo du stockst, sitzt die Lücke. Danach bewertet Jarvis.")
      ),
      setup.priming ? h("div", { className: "mos__co-fey-prime" }, h(Icon, { name: "lightbulb", size: 12 }), setup.priming) : null,
      // concept card
      h(
        "div",
        { className: "mos__co-fey-concept" },
        h(
          "div",
          { className: "mos__co-fey-concept-head" },
          h("span", { className: "mos__co-fey-concept-k" }, "Erklär mir"),
          setup.conceptSource && setup.conceptSource !== "none" ? h(
            "span",
            { className: "mos__co-fey-src" },
            h(Icon, { name: "book-open", size: 10 }),
            { "anki-karte": "aus Anki-Karte", "exams.json": "aus exams.json", "eigenes": "eigenes" }[setup.conceptSource] || setup.conceptSource
          ) : null,
          h("button", {
            type: "button",
            className: "mos__co-fey-next",
            onClick: props.onNextConcept,
            title: "Anderes Konzept"
          }, h(Icon, { name: "rotate-ccw", size: 12 }), "anderes")
        ),
        h("div", { className: "mos__co-fey-concept-v" }, concept || "(kein Konzept — gib selbst eines ein)")
      ),
      // explanation textarea
      h(
        "label",
        { className: "mos__co-fey-field" },
        h("span", { className: "mos__co-fey-field-k" }, "Deine Erklärung (frei, in eigenen Worten)"),
        h("textarea", {
          className: "mos__co-fey-textarea",
          rows: 5,
          placeholder: "Erklär das Konzept so, als würdest du es einer interessierten Laiin erklären …",
          value: fey.explanation || "",
          disabled: busy,
          onChange: (e) => props.onExplain(e.target.value)
        })
      ),
      // Jarvis dependency banner — honest about what grades this.
      h(
        "div",
        { className: "mos__co-jbanner mos--" + (jarvis.ready ? "verified" : "amber") },
        h(Icon, { name: jarvis.ready ? "sparkles" : "triangle-alert", size: 13 }),
        h("span", null, jarvis.ready ? COACH_JARVIS_NOTE : jarvis.note || "Jarvis-Bewertung ausstehend — die Erklärung wird nicht bewertet, nichts gespeichert.")
      ),
      // result (real Jarvis feedback) or evaluating/pending states
      busy ? h(
        "div",
        { className: "mos__co-panel mos--muted" },
        h("span", { className: "mos__co-panel-icon is-spin" }, h(Icon, { name: "loader", size: 24 })),
        h("span", { className: "mos__co-panel-title" }, "Jarvis bewertet …"),
        h("span", { className: "mos__co-panel-note" }, "Brain-Kette (abo-first) · READ/Coaching")
      ) : result ? result.ok ? h(
        "div",
        { className: "mos__co-fey-result" },
        h(
          "div",
          { className: "mos__co-fey-result-head" },
          h(Icon, { name: "sparkles", size: 14 }),
          "Jarvis-Feedback",
          result.model ? h("span", { className: "mos__co-fey-model" }, result.model + (result.routeClass ? " · " + result.routeClass : "")) : null
        ),
        h("div", { className: "mos__co-fey-feedback" }, result.feedback),
        h(
          "div",
          { className: "mos__co-honest" },
          h(Icon, { name: "eye", size: 12 }),
          h("span", null, result.note || COACH_JARVIS_NOTE)
        )
      ) : h(
        "div",
        { className: "mos__co-panel mos--amber" },
        h("span", { className: "mos__co-panel-icon" }, h(Icon, { name: "triangle-alert", size: 24 })),
        h("span", { className: "mos__co-panel-title" }, "Bewertung ausstehend"),
        h("span", { className: "mos__co-panel-note" }, result.note || "Jarvis-Bewertung nicht möglich — nichts wurde erfunden, nichts gespeichert.")
      ) : null,
      // send button
      h(
        "div",
        { className: "mos__co-fey-actions" },
        h("button", {
          type: "button",
          className: "mos__co-btn mos__co-btn--primary",
          disabled: busy || !(fey.explanation || "").trim(),
          onClick: props.onEvaluate,
          title: jarvis.ready ? "Erklärung an Jarvis zur Bewertung senden." : "Sendet an Jarvis — ist die Anbindung aus, bleibt die Bewertung ehrlich ausstehend."
        }, h(Icon, { name: "send-horizontal", size: 15 }), "An Jarvis senden")
      )
    );
  }
  function CoachPlan(props) {
    const st = props.state;
    const plan = st.plan || {};
    const exams = (plan.exams || []).filter((e) => e && e.valid !== false && (e.daysLeft == null || e.daysLeft >= 0));
    return h(
      "div",
      { className: "mos__co-scroll" },
      h(
        "div",
        { className: "mos__co-plan-intro" },
        h(Icon, { name: "shield-check", size: 13 }),
        h(
          "span",
          null,
          "Ein Lernplan wird als Mission VORGESCHLAGEN: Dry-Run-Vorschau → „An Gate senden“ → Freigabe. ",
          h("b", null, "Studium/privat"),
          " — kein Geld, keine Firma. Das Plugin führt nichts aus; dein Gate entscheidet."
        )
      ),
      exams.length ? h(
        "div",
        { className: "mos__co-plan-list" },
        exams.map((e) => h(
          "button",
          {
            key: e.fach + e.datum,
            type: "button",
            className: "mos__co-plan-item",
            onClick: () => props.onPropose(studyObjective(e), "study"),
            title: "Baut eine Dry-Run-Vorschau — sendet nichts, bis du klickst."
          },
          h(
            "span",
            { className: "mos__co-plan-item-l" },
            h(Icon, { name: "list-todo", size: 15 }),
            h("span", { className: "mos__co-plan-item-fach" }, "Lernplan bis " + e.fach),
            h("span", { className: "mos__co-plan-item-sub" }, (e.daysHuman || "in " + e.daysLeft + " Tagen") + " · " + e.themenCount + " Themen")
          ),
          h("span", { className: "mos__co-plan-item-cta" }, h(Icon, { name: "flask-conical", size: 12 }), "Vorschau")
        ))
      ) : h(
        "div",
        { className: "mos__co-panel mos--muted" },
        h("span", { className: "mos__co-panel-icon" }, h(Icon, { name: "list-todo", size: 26 })),
        h("span", { className: "mos__co-panel-title" }, "Keine anstehende Klausur"),
        h("span", { className: "mos__co-panel-note" }, "Lege Termine in exams.json an — dann kannst du je Fach einen Lernplan vorschlagen.")
      ),
      h(
        "div",
        { className: "mos__co-honest" },
        h(Icon, { name: "lock", size: 12 }),
        h("span", null, "Propose-only über den gegateten /actions-Weg (workspace=studium). Nie /approvals/decide, nie Anki-Schreibzugriff.")
      )
    );
  }
  function intakeSlug(value, fallback) {
    const text = String(value || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
    return text || fallback;
  }
  function CoachIntake(props) {
    const plan = props.state && props.state.plan || {};
    const exam = plan.nextExam || (plan.exams || []).find((e) => e && e.valid !== false) || {};
    const [files, setFiles] = useState([]);
    const [tenant, setTenant] = useState("uni:mikael");
    const [moduleId, setModuleId] = useState(() => intakeSlug(exam.fach, "studium"));
    const [examId, setExamId] = useState(() => intakeSlug((exam.fach || "pruefung") + "-" + (exam.datum || "aktuell"), "pruefung-aktuell"));
    const [examDate, setExamDate] = useState(exam.datum || "");
    const [question, setQuestion] = useState("Welche Inhalte sind für die Prüfung am wichtigsten?");
    const [phase, setPhase] = useState("idle");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const submit = useCallback((event) => {
      if (event && event.preventDefault) event.preventDefault();
      if (!files.length || !tenant.trim() || !moduleId.trim() || !examId.trim() || !examDate || !question.trim()) {
        setError("PDFs, Uni-Workspace, Modul, Prüfung, Datum und Frage sind erforderlich.");
        return;
      }
      const form = new FormData();
      files.forEach((file) => form.append("files", file, file.name));
      form.append("tenant_id", tenant.trim());
      form.append("module_id", moduleId.trim());
      form.append("exam_id", examId.trim());
      form.append("exam_date", examDate);
      form.append("question", question.trim());
      form.append("exam_form", "written");
      setPhase("loading");
      setError("");
      setResult(null);
      sdkPostForm(LEARNING_INTAKE_API, form).then((data) => {
        setResult(data || null);
        setPhase("done");
      }).catch((reason) => {
        setError(reason && (reason.detail || reason.message) || "PDF-Analyse nicht möglich.");
        setPhase("error");
      });
    }, [files, tenant, moduleId, examId, examDate, question]);
    const dc = result && result.direct_context || {};
    const receipt = result && result.receipt || {};
    return h(
      "div",
      { className: "mos__co-scroll" },
      h(
        "div",
        { className: "mos__co-plan-intro" },
        h(Icon, { name: "file-plus", size: 14 }),
        h(
          "span",
          null,
          "Bis zu 8 PDFs werden sofort lokal gelesen und mit Seitenzitaten in den Kontext gelegt. ",
          h("b", null, "Nur Studium/privat"),
          " · kein Upload-Speicher, kein Embedding, kein Graph-Write."
        )
      ),
      h(
        "form",
        { className: "mos__intake-form", onSubmit: submit },
        h(
          "label",
          { className: "mos__intake-drop" },
          h(Icon, { name: "file-plus", size: 24 }),
          h("span", { className: "mos__intake-drop-title" }, files.length ? files.length + " PDF(s) gewählt" : "PDF-Lernmaterial auswählen"),
          h("span", { className: "mos__intake-drop-note" }, "Mehrfachauswahl · je PDF max. 20 MiB / 200 Seiten"),
          h("input", {
            type: "file",
            accept: "application/pdf,.pdf",
            multiple: true,
            onChange: (e) => setFiles(Array.from(e.target && e.target.files || []).slice(0, 8))
          })
        ),
        h(
          "div",
          { className: "mos__intake-grid" },
          h("label", null, h("span", null, "Uni-Workspace"), h("input", { value: tenant, onChange: (e) => setTenant(e.target.value), placeholder: "uni:tum" })),
          h("label", null, h("span", null, "Modul-ID"), h("input", { value: moduleId, onChange: (e) => setModuleId(e.target.value), placeholder: "thermodynamik-1" })),
          h("label", null, h("span", null, "Prüfungs-ID"), h("input", { value: examId, onChange: (e) => setExamId(e.target.value), placeholder: "thermo-ws26" })),
          h("label", null, h("span", null, "Prüfungsdatum"), h("input", { type: "date", value: examDate, onChange: (e) => setExamDate(e.target.value) }))
        ),
        h(
          "label",
          { className: "mos__intake-question" },
          h("span", null, "Was soll Jarvis daraus beantworten?"),
          h("textarea", { rows: 3, value: question, onChange: (e) => setQuestion(e.target.value) })
        ),
        error ? h("div", { className: "mos__co-panel mos--red" }, h(Icon, { name: "triangle-alert", size: 16 }), h("span", null, error)) : null,
        h(
          "button",
          { type: "submit", className: "mos__co-btn mos__co-btn--primary", disabled: phase === "loading" },
          h(Icon, { name: phase === "loading" ? "loader" : "file-text", size: 15, className: phase === "loading" ? "is-spin" : "" }),
          phase === "loading" ? "Analysiere lokal …" : "Direkt-Kontext vorbereiten"
        )
      ),
      result ? h(
        "div",
        { className: "mos__intake-receipt mos--" + (dc.answer_ready ? "verified" : "amber") },
        h(
          "div",
          { className: "mos__intake-receipt-head" },
          h(Icon, { name: dc.answer_ready ? "circle-check-big" : "triangle-alert", size: 16 }),
          h("b", null, dc.answer_ready ? "Antwortbereit" : "Partitionsauswahl nötig"),
          h("code", null, receipt.receipt_id || "—")
        ),
        h(
          "div",
          { className: "mos__intake-stats" },
          h("span", null, (dc.document_count || 0) + " eindeutige PDFs"),
          h("span", null, (dc.citations || []).length + " Seitenzitate"),
          h("span", null, (dc.duplicate_count || 0) + " SHA-Duplikate"),
          h("span", null, (dc.needs_vision || []).length + " Vision-Seiten")
        ),
        h(
          "div",
          { className: "mos__co-honest" },
          h(Icon, { name: "lock", size: 12 }),
          h("span", null, "Receipt ist deterministisch, aber nicht gespeichert. will_write=false · Qdrant=false · Neo4j=false.")
        )
      ) : null
    );
  }
  function CoachSurface(props) {
    const st = props.state;
    useEffect(() => {
      if (!st) return void 0;
      function onKey(e) {
        if (e.key === "Escape") {
          e.preventDefault();
          props.onClose();
        }
      }
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [st, props.onClose]);
    if (!st) return null;
    const tab = st.tab || "countdown";
    const jarvis = st.plan && st.plan.jarvis || st.fey && st.fey.setup && st.fey.setup.jarvis || {};
    let body;
    if (tab === "feynman") body = h(CoachFeynman, { state: st, onExplain: props.onExplain, onEvaluate: props.onEvaluate, onNextConcept: props.onNextConcept });
    else if (tab === "plan") body = h(CoachPlan, { state: st, onPropose: props.onPropose });
    else if (tab === "material") body = h(CoachIntake, { state: st });
    else body = h(CoachCountdown, { state: st });
    return h(
      "div",
      { className: "mos__co-scrim", onClick: props.onClose },
      h(
        "section",
        {
          className: "mos__co",
          role: "dialog",
          "aria-modal": "true",
          "aria-label": "Lern-Coach",
          onClick: (e) => e.stopPropagation()
        },
        h(
          "header",
          { className: "mos__co-head" },
          h("span", { className: "mos__co-head-badge" }, h(Icon, { name: "graduation-cap", size: 18 })),
          h(
            "span",
            { className: "mos__co-head-titles" },
            h("span", { className: "mos__co-head-title" }, "Lern-Coach"),
            h("span", { className: "mos__co-head-sub" }, "Countdown · Feynman · Lernplan · PDF-Kontext")
          ),
          h(CoachJarvisPip, { jarvis }),
          h(
            "button",
            { type: "button", className: "mos__iconbtn mos__iconbtn--close", "aria-label": "Coach schließen", onClick: props.onClose },
            h(Icon, { name: "x", size: 18 })
          )
        ),
        h(
          "div",
          { className: "mos__co-tabs", role: "tablist" },
          COACH_TABS.map((t) => h("button", {
            key: t.id,
            type: "button",
            role: "tab",
            "aria-selected": tab === t.id ? "true" : "false",
            className: "mos__co-tab" + (tab === t.id ? " is-active" : ""),
            onClick: () => props.onTab(t.id)
          }, h(Icon, { name: t.icon, size: 15 }), t.label))
        ),
        h("div", { className: "mos__co-body" }, body)
      )
    );
  }
  const ZONE_TONE = {
    fresh: "verified",
    stale: "amber",
    partial: "blue",
    empty: "muted",
    unavailable: "red",
    error: "red",
    loading: "muted",
    gated: "gated"
  };
  const WS_TAG = {
    private: { label: "Privat", tone: "cyan" },
    company_signal: { label: "Firma", tone: "neutral" },
    engineering: { label: "Eng", tone: "violet" },
    // M3/wissen — the session/history corpus mixes private + company work and is
    // NOT cleanly separable, so it gets its own honest fourth tone (amber, striped)
    // and is never silently shown as cyan-private nor neutral-company.
    gemischt: { label: "Gemischt", tone: "amber" }
  };
  function gateCategory(gc, gr, text) {
    const s = ((gc || "") + " " + (gr || "") + " " + (text || "")).toLowerCase();
    if (/personal|personnel|\bhr\b|mitarbeiter|lohn|gehalt/.test(s)) return { label: "Personal", tone: "violet", icon: "user" };
    if (/money|billing|invoice|sevdesk|payment|rechnung|buchen|zahlung|geld|betrag/.test(s)) return { label: "Geld", tone: "amber", icon: "banknote" };
    if (/customer|extern|kunde|versand|auftrag|angebot|mail/.test(s)) return { label: "Kunde", tone: "blue", icon: "building-2" };
    if (/restart|prod-restart|neustart/.test(s)) return { label: "Restart", tone: "red", icon: "server" };
    if (/destructive|schema|delete|destruktiv|migration|\bdrop\b/.test(s)) return { label: "Daten", tone: "red", icon: "octagon-alert" };
    return { label: "Gate", tone: "gated", icon: "shield-check" };
  }
  function ZonePip(props) {
    const st = props.state || "loading";
    if (st === "konzept") {
      return h(
        "span",
        { className: "mos__pip mos__pip--konzept mos__zone-pip", title: props.note || "Konzeptdaten" },
        h(Icon, { name: "flask-conical", size: 11 }),
        "Konzept"
      );
    }
    const meta = STATE_META[st] || STATE_META.loading;
    const tone = ZONE_TONE[st] || "muted";
    const fresh = props.observedAt ? freshnessLabel(props.observedAt) : null;
    const tip = [props.source && "Quelle: " + props.source, fresh && "Stand: " + fresh, props.note].filter(Boolean).join(" · ");
    return h(
      "span",
      { className: "mos__pip mos__pip--" + tone + " mos__zone-pip", title: tip || meta.label },
      st === "loading" ? h(Icon, { name: "loader", size: 11, className: "is-spin" }) : h("span", { className: "mos__pip-dot", "aria-hidden": "true" }),
      meta.label,
      fresh && (st === "fresh" || st === "stale" || st === "partial") ? h("span", { className: "mos__pip-age" }, fresh) : null
    );
  }
  function ZoneEmpty(props) {
    const st = props.state || "empty";
    const bad = st === "unavailable" || st === "error";
    return h(
      "div",
      { className: "mos__zone-empty mos--" + (bad ? "red" : "muted") },
      h(Icon, { name: bad ? "unplug" : props.icon || "inbox", size: 20 }),
      h("span", { className: "mos__zone-empty-t" }, props.title || (STATE_META[st] || STATE_META.empty).label),
      props.note ? h("span", { className: "mos__zone-empty-n" }, props.note) : null
    );
  }
  function LernmodusLaunch() {
    const [st, setSt] = useState(null);
    const open = () => {
      let win = null;
      try {
        win = window.open("about:blank", "_blank");
      } catch (_e) {
        win = null;
      }
      if (win) {
        try {
          win.opener = null;
        } catch (_e) {
        }
      }
      setSt({ phase: "opening" });
      const sdk = typeof window !== "undefined" && window.__HERMES_PLUGIN_SDK__ || {};
      const call = typeof sdk.authedFetch === "function" ? Promise.resolve(sdk.authedFetch(LEARNING_LAUNCH_API)) : typeof fetch === "function" ? fetch(LEARNING_LAUNCH_API) : Promise.reject(new Error("no transport"));
      call.then((r) => r && typeof r.json === "function" ? r.json().catch(() => ({})) : r).then((data) => {
        if (!data || data.ok !== true || !data.launch_url) {
          if (win) {
            try {
              win.close();
            } catch (_e) {
            }
          }
          setSt({ phase: "error", message: "Lernmodus nicht geöffnet — Backend lieferte keinen Link." });
          return;
        }
        if (win) {
          try {
            win.location.replace(data.launch_url);
          } catch (_e) {
          }
          setSt({ phase: "open", url: data.launch_url, popupBlocked: false });
        } else {
          setSt({ phase: "open", url: data.launch_url, popupBlocked: true });
        }
      }).catch(() => {
        if (win) {
          try {
            win.close();
          } catch (_e) {
          }
        }
        setSt({ phase: "error", message: "Backend nicht erreichbar — Lernmodus nicht geöffnet." });
      });
    };
    const phase = st && st.phase;
    const hint = phase === "open" ? st.popupBlocked ? h(
      "a",
      { className: "mos__vlaunch-link", href: st.url, target: "_blank", rel: "noopener" },
      h(Icon, { name: "external-link", size: 15 }),
      "Lernmodus öffnen"
    ) : h("span", { className: "mos__vlaunch-count" }, h(Icon, { name: "circle-check-big", size: 13 }), "In neuem Tab geöffnet.") : phase === "error" ? h("span", { className: "mos__vlaunch-count is-expired" }, st.message) : null;
    return h(
      React.Fragment,
      null,
      h("button", {
        key: "lernmodus",
        type: "button",
        className: "mos__tool",
        onClick: open,
        disabled: phase === "opening",
        title: "Öffnet die private Lernplattform direkt im Foliencoach (neuer Tab)."
      }, h(Icon, {
        name: phase === "opening" ? "loader" : "external-link",
        size: 15,
        className: phase === "opening" ? "is-spin" : void 0
      }), "Lernmodus starten"),
      hint
    );
  }
  function FirmaMetric(props) {
    const r = props.row;
    return h(
      "div",
      { className: "mos__firma-metric mos--" + (r.accent || "cyan") },
      h("span", { className: "mos__firma-metric-ico" }, h(Icon, { name: r.icon || "activity", size: 15 })),
      h(
        "span",
        { className: "mos__firma-metric-body" },
        h("span", { className: "mos__firma-metric-title" }, r.title),
        r.sub ? h("span", { className: "mos__firma-metric-sub" }, r.sub) : null
      ),
      r.status ? h("span", { className: "mos__status mos__status--" + r.status }, r.statusLabel) : r.value ? h("span", { className: "mos__firma-metric-val" }, r.value) : null
    );
  }
  function ApprovalCard(props) {
    const c = props.card;
    const cat = gateCategory(c.gateClass, c.gateReason, c.text);
    const fresh = freshnessLabel(c.createdUtc);
    const shortHash = c.intentSha256 ? c.intentSha256.slice(0, 12) : null;
    const open = props.open;
    return h(
      "div",
      { className: "mos__appc-card mos__appc-card--" + cat.tone + (open ? " is-open" : "") },
      h(
        "div",
        { className: "mos__appc-top" },
        h("span", { className: "mos__appc-cat mos__appc-cat--" + cat.tone }, h(Icon, { name: cat.icon, size: 12 }), cat.label),
        h("span", { className: "mos__appc-text" }, c.text),
        fresh ? h("span", { className: "mos__appc-when" }, fresh) : null
      ),
      h(
        "div",
        { className: "mos__appc-meta" },
        c.mandant ? h("span", { className: "mos__appc-tag" }, c.mandant) : null,
        c.targetSystem ? h("span", { className: "mos__appc-tag" }, c.targetSystem) : null,
        shortHash ? h("span", { className: "mos__appc-hash", title: "Intent-Hash: " + c.intentSha256 }, h(Icon, { name: "hash", size: 11 }), shortHash) : null,
        h(
          "button",
          {
            type: "button",
            className: "mos__appc-details",
            "aria-expanded": open ? "true" : "false",
            onClick: () => props.onToggle(c.id),
            title: "Nur-Lese-Details. Freigabe/Ablehnung ausschließlich im Operator-Approval-Center (Hermes) — nie aus dem Plugin."
          },
          h(Icon, { name: "eye", size: 13 }),
          "Details"
        )
      ),
      open ? props.scene ? h(ApprovalDetailRich, { card: c, detail: props.detail, loading: props.detailLoading }) : h(
        "dl",
        { className: "mos__appc-detail" },
        h("div", null, h("dt", null, "Gate"), h("dd", null, (c.gateClass || "—") + (c.gateReason ? " · " + c.gateReason : ""))),
        c.intentSha256 ? h("div", null, h("dt", null, "Intent-Hash"), h("dd", { className: "mos__mono" }, c.intentSha256)) : null,
        c.idempotencyKey ? h("div", null, h("dt", null, "Idempotenz"), h("dd", { className: "mos__mono" }, c.idempotencyKey)) : null,
        c.payloadSha256 ? h("div", null, h("dt", null, "Payload-Hash"), h("dd", { className: "mos__mono" }, c.payloadSha256)) : null,
        h(
          "div",
          { className: "mos__appc-decidenote" },
          h(Icon, { name: "shield-check", size: 12 }),
          "Entscheidung nur im Operator-Approval-Center. Dieses Cockpit liest ausschließlich."
        )
      ) : null
    );
  }
  const APPC_FIELD_LABELS = {
    command: "Befehl",
    device: "Gerät",
    target: "Ziel",
    execution_path_policy: "Ausführungspfad",
    agent: "Agent",
    domain: "Domäne",
    tool: "Werkzeug",
    sensitivity: "Sensitivität",
    rechnungsbetrag: "Rechnungsbetrag",
    empfaenger: "Empfänger",
    zahlungsziel: "Zahlungsziel",
    buchungskonto: "Buchungskonto"
  };
  function _appcFieldLabel(k) {
    return APPC_FIELD_LABELS[k] || String(k).replace(/_/g, " ");
  }
  function ApprovalDetailRich(props) {
    const d = props.detail;
    if (props.loading || !d) {
      return h(
        "div",
        { className: "mos__apd" },
        h("div", { className: "mos__skrow" }),
        h("div", { className: "mos__skrow" })
      );
    }
    if (d.ok === false || d.found === false) {
      return h(
        "div",
        { className: "mos__apd" },
        h(ZoneEmpty, {
          state: "unavailable",
          icon: "inbox",
          title: "Detail nicht verfügbar",
          note: d.note || "Approval-Card nicht lesbar."
        }),
        h(
          "div",
          { className: "mos__apd-lock" },
          h(Icon, { name: "lock", size: 13 }),
          h("span", null, "Entscheidung nur durch dich (Operator)")
        )
      );
    }
    const c = props.card;
    const fields = d.structuredFields && typeof d.structuredFields === "object" ? Object.keys(d.structuredFields).filter((k) => d.structuredFields[k] != null && d.structuredFields[k] !== "") : [];
    const affected = Array.isArray(d.affectedObjects) ? d.affectedObjects : [];
    const risks = Array.isArray(d.risks) ? d.risks : [];
    const evidence = Array.isArray(d.evidence) ? d.evidence : [];
    const gateClass = d.gateClass || c && c.gateClass || "—";
    const gateReason = d.gateReason || c && c.gateReason;
    const intent = d.intentSha256 || c && c.intentSha256;
    const approveUrl = d.approveUrl || d.decideUrl && d.decideUrl.approve || null;
    const rejectUrl = d.rejectUrl || d.decideUrl && d.decideUrl.reject || null;
    return h(
      "div",
      { className: "mos__apd" },
      // Expected effect — the plain-language "what will happen".
      d.expectedEffect ? h(
        "div",
        { className: "mos__apd-effect" },
        h("span", { className: "mos__apd-effect-k" }, h(Icon, { name: "zap", size: 12 }), "Erwarteter Effekt"),
        h("span", { className: "mos__apd-effect-v" }, d.expectedEffect)
      ) : null,
      // BETROFFENE FELDER — the structured field table (only if the card carried one).
      fields.length ? h(
        "div",
        { className: "mos__apd-sec" },
        h("span", { className: "mos__apd-sec-h" }, "Betroffene Felder"),
        h(
          "dl",
          { className: "mos__apd-fields" },
          fields.map((k) => h(
            "div",
            { key: k, className: "mos__apd-field" },
            h("dt", null, _appcFieldLabel(k)),
            h("dd", null, String(d.structuredFields[k]))
          ))
        )
      ) : null,
      // Affected objects — chips (adress-first identity where present).
      affected.length ? h(
        "div",
        { className: "mos__apd-sec" },
        h("span", { className: "mos__apd-sec-h" }, "Betroffene Objekte"),
        h(
          "div",
          { className: "mos__apd-chips" },
          affected.map((o, i) => h(
            "span",
            { key: i, className: "mos__apd-chip" },
            h(Icon, { name: "building-2", size: 11 }),
            String(typeof o === "object" ? o.label || o.id || JSON.stringify(o) : o)
          ))
        )
      ) : null,
      // Risks — honest amber list.
      risks.length ? h(
        "div",
        { className: "mos__apd-sec" },
        h("span", { className: "mos__apd-sec-h" }, "Risiken"),
        h(
          "ul",
          { className: "mos__apd-list mos__apd-list--risk" },
          risks.map((r, i) => h(
            "li",
            { key: i },
            h(Icon, { name: "triangle-alert", size: 12 }),
            String(typeof r === "object" ? r.text || r.detail || JSON.stringify(r) : r)
          ))
        )
      ) : null,
      // Evidence — read-only provenance list.
      evidence.length ? h(
        "div",
        { className: "mos__apd-sec" },
        h("span", { className: "mos__apd-sec-h" }, "Belege / Evidenz"),
        h(
          "ul",
          { className: "mos__apd-list" },
          evidence.map((e, i) => h(
            "li",
            { key: i },
            h(Icon, { name: "file-text", size: 12 }),
            String(typeof e === "object" ? e.text || e.ref || e.source || JSON.stringify(e) : e)
          ))
        )
      ) : null,
      // Proof hashes — the audit of exactly which intent/payload is gated.
      h(
        "dl",
        { className: "mos__appc-detail mos__apd-hashes" },
        h("div", null, h("dt", null, "Gate"), h("dd", null, gateClass + (gateReason ? " · " + gateReason : ""))),
        d.status ? h("div", null, h("dt", null, "Status"), h("dd", null, d.status + (d.expiresAt ? " · läuft ab " + d.expiresAt : ""))) : null,
        intent ? h("div", null, h("dt", null, "Intent-Hash"), h("dd", { className: "mos__mono" }, intent)) : null,
        d.idempotencyKey ? h("div", null, h("dt", null, "Idempotenz"), h("dd", { className: "mos__mono" }, d.idempotencyKey)) : null,
        d.payloadSha256 ? h("div", null, h("dt", null, "Payload-Hash"), h("dd", { className: "mos__mono" }, d.payloadSha256)) : null,
        d.preconditionsSha256 ? h("div", null, h("dt", null, "Vorbedingungen"), h("dd", { className: "mos__mono" }, d.preconditionsSha256)) : null
      ),
      // Gated action row — ALWAYS visible, so the "gegatete Aktions-Row" pattern is
      // legible (visible-but-locked) exactly as the mockup shows. When the backend
      // supplies a decide surface each button is a NAVIGATION-only deep-link into
      // the Operator's Hermes decide UI (new tab); when absent it renders visibly
      // DISABLED. Never a working control, never /approvals/decide, never a
      // fabricated navigation target.
      h(
        "div",
        { className: "mos__apd-actions", role: "group", "aria-label": "Entscheidung — nur Operator" },
        h(GatedActionButton, { url: approveUrl, label: "Genehmigen", icon: "circle-check-big", variant: "approve" }),
        h(GatedActionButton, { url: rejectUrl, label: "Ablehnen", icon: "octagon-alert", variant: "reject" })
      ),
      // Permanent lock caption — decision authority is the Operator, always visible.
      h(
        "div",
        { className: "mos__apd-lock" },
        h(Icon, { name: "lock", size: 13 }),
        h("span", null, d.decisionNote || "Entscheidung (genehmigen/ablehnen) nur durch dich (Operator) über das Approval-Center / den Operator-Bot. Dieses Plugin liest nur — es ruft nie /approvals/decide.")
      )
    );
  }
  function DeepLinkButton(props) {
    const link = props.link;
    if (!link || !link.url) return null;
    return h(
      "a",
      {
        className: "mos__deeplink" + (props.variant ? " mos__deeplink--" + props.variant : ""),
        href: link.url,
        target: "_blank",
        rel: "noopener noreferrer",
        title: link.label || props.label || "Im FSM öffnen"
      },
      props.icon ? h(Icon, { name: props.icon, size: 13 }) : null,
      h("span", null, props.label || link.label || "im FSM öffnen"),
      h(Icon, { name: "arrow-up-right", size: 12 })
    );
  }
  function GatedActionButton(props) {
    const cls = "mos__deeplink mos__deeplink--" + props.variant;
    if (props.url) {
      return h(
        "a",
        {
          className: cls,
          href: props.url,
          target: "_blank",
          rel: "noopener noreferrer",
          title: props.label + " im Operator-Approval-Center (Hermes) öffnen — Entscheidung dort, nie im Plugin."
        },
        h(Icon, { name: props.icon, size: 13 }),
        h("span", null, props.label),
        h(Icon, { name: "arrow-up-right", size: 12 })
      );
    }
    return h(
      "button",
      {
        type: "button",
        disabled: true,
        "aria-disabled": "true",
        className: cls + " is-gated",
        title: "Nur der Operator entscheidet — im Approval-Center (Hermes) bzw. über den Operator-Bot. Dieses Plugin kann nicht genehmigen/ablehnen."
      },
      h(Icon, { name: props.icon, size: 13 }),
      h("span", null, props.label),
      h(Icon, { name: "lock", size: 12 })
    );
  }
  const APPC_MAX = 4;
  function ApprovalCenter(props) {
    const a = props.approvals, load = props.load, scene = props.scene;
    const [openId, setOpenId] = useState(null);
    const [showAll, setShowAll] = useState(false);
    const st = a ? a.state || "empty" : load === "loading" ? "loading" : "unavailable";
    const cards = a && Array.isArray(a.cards) ? a.cards : [];
    const pending = a ? a.pending != null ? a.pending : cards.length : 0;
    const initRef = useRef(false);
    const onLoadDetail = props.onLoadDetail;
    useEffect(() => {
      if (!scene || initRef.current || !cards.length) return;
      initRef.current = true;
      const firstId = cards[0].id;
      setOpenId(firstId);
      if (onLoadDetail) onLoadDetail(firstId);
    }, [scene, cards, onLoadDetail]);
    const max = props.compact ? 1 : APPC_MAX;
    const shown = scene || showAll ? cards : cards.slice(0, max);
    const extra = cards.length - shown.length;
    const onToggle = useCallback((id) => {
      setOpenId((p) => {
        const next = p === id ? null : id;
        if (next && scene && onLoadDetail) onLoadDetail(next);
        return next;
      });
    }, [scene, onLoadDetail]);
    const body = load === "loading" && !a ? [0, 1].map((i) => h("div", { key: i, className: "mos__skrow" })) : cards.length ? [
      ...shown.map((c) => h(ApprovalCard, {
        key: c.id,
        card: c,
        open: openId === c.id,
        onToggle,
        scene,
        detail: scene && props.details ? props.details[c.id] : void 0,
        detailLoading: scene && props.detailLoading ? !!props.detailLoading[c.id] : false
      })),
      extra > 0 && !scene ? h(
        "button",
        { key: "more", type: "button", className: "mos__appc-more", onClick: props.compact ? props.onMore : () => setShowAll(true) },
        h(Icon, { name: "ellipsis", size: 14 }),
        "+" + extra + " weitere"
      ) : null
    ] : h(ZoneEmpty, {
      state: st,
      icon: "inbox",
      title: st === "unavailable" || st === "error" ? "Approval-Quelle nicht erreichbar" : "Keine offenen Freigaben",
      note: a && a.note
    });
    if (scene) {
      return h("div", { className: "mos__appc mos__appc--scene", role: "list", "aria-label": "Offene Freigaben" }, body);
    }
    return h(
      "section",
      { className: "mos__card mos__appc" + (props.flash ? " is-flash" : ""), ref: props.innerRef, id: "mos-approvals" },
      h(
        "header",
        { className: "mos__card-head" },
        h(Icon, { name: "shield-check", size: 16 }),
        h("span", { className: "mos__card-title" }, "Freigaben"),
        pending > 0 ? h("span", { className: "mos__appc-count" }, pending) : null,
        props.onOpen ? h(
          "button",
          {
            type: "button",
            className: "mos__card-open mos__card-open--icon",
            onClick: props.onOpen,
            title: "Entscheidungen-Center öffnen (Intent-Hash, Effekt-Felder · Entscheidung nur Operator)",
            "aria-label": "Entscheidungen-Center öffnen"
          },
          h(Icon, { name: "arrow-up-right", size: 15 })
        ) : null,
        h(ZonePip, { state: st, observedAt: a && a.observedAt, source: a && a.source, note: a && a.note })
      ),
      h("div", { className: "mos__appc-body" }, body)
    );
  }
  function FirmaDomainCard(props) {
    const card = props.card || {};
    const st = card.state || (props.load === "loading" ? "loading" : "unavailable");
    const rows = Array.isArray(card.rows) ? card.rows : [];
    const bad = st === "unavailable" || st === "error";
    const empty = st === "empty";
    const fresh = card.observedAt ? freshnessLabel(card.observedAt) : null;
    const deep = card.deepLink && card.deepLink.url ? card.deepLink : null;
    return h(
      "section",
      { className: "mos__card mos__fdcard" },
      h(
        "header",
        { className: "mos__card-head mos__fdcard-head" },
        h(Icon, { name: card.icon || "server", size: 16 }),
        h("span", { className: "mos__card-title" }, card.title || card.id),
        deep ? h(DeepLinkButton, {
          link: deep,
          label: deep.label || "im FSM öffnen",
          icon: deep.externalSystem === "paperless" ? "folder-open" : "external-link"
        }) : null,
        h(ZonePip, { state: st, observedAt: card.observedAt, source: card.source, note: card.note })
      ),
      h(
        "div",
        { className: "mos__fdcard-body" },
        card.summary && !bad ? h("div", { className: "mos__fdcard-summary" }, card.summary) : null,
        props.load === "loading" && !props.card ? [0, 1, 2].map((i) => h("div", { key: i, className: "mos__skrow" })) : bad || empty || !rows.length ? h(ZoneEmpty, {
          state: bad ? st : "empty",
          icon: card.icon || "inbox",
          title: bad ? card.summary || "Quelle nicht erreichbar" : card.summary || "Keine Signale",
          note: card.note
        }) : h(
          "div",
          { className: "mos__fdcard-rows" },
          rows.map((r, i) => h(FirmaMetric, { key: i, row: r }))
        )
      ),
      h(
        "footer",
        { className: "mos__firma-foot mos__fdcard-foot" },
        h(Icon, { name: "lock", size: 12 }),
        h(
          "span",
          { className: "mos__firma-foot-t" },
          (card.source ? "Quelle: " + card.source : "Firma-Signal") + (fresh ? " · Stand: " + fresh : "")
        ),
        h("span", { className: "mos__firma-foot-ro" }, card.permission ? "Nur lesen" : "Nur lesen")
      )
    );
  }
  const FIRMA_CARD_ORDER = ["auftraege", "billing", "dispo", "wartung", "dokumente", "runtime"];
  function FirmaScene(props) {
    const ov = props.firma;
    const load = props.load;
    const raw = ov && Array.isArray(ov.cards) ? ov.cards : [];
    const byId = {};
    raw.forEach((c) => {
      byId[c.id] = c;
    });
    const ordered = FIRMA_CARD_ORDER.map((id) => byId[id]).filter(Boolean);
    const cards = ordered.length ? ordered : raw;
    const offline = load === "offline" || !ov && load !== "loading";
    return h(
      "div",
      { className: "mos__firmascene" },
      offline && !cards.length ? h(ZoneEmpty, {
        state: "unavailable",
        icon: "server",
        title: "Firma-Projektion nicht erreichbar",
        note: "Read-Modelle offline — die Karten erscheinen, sobald /firma/overview wieder antwortet."
      }) : h(
        "div",
        { className: "mos__firmagrid" },
        (cards.length ? cards : FIRMA_CARD_ORDER.map((id) => ({ id }))).map((c) => h(FirmaDomainCard, { key: c.id, card: ov ? c : null, load }))
      )
    );
  }
  const SUMMARY_BUCKETS = [
    { key: "Geld", icon: "banknote", tone: "amber" },
    { key: "Kunde", icon: "building-2", tone: "blue" },
    { key: "Daten", icon: "octagon-alert", tone: "red" },
    { key: "Personal", icon: "user", tone: "violet" }
  ];
  function SummaryRail(props) {
    const cards = props.cards || [];
    const counts = {};
    cards.forEach((c) => {
      const cat = gateCategory(c.gateClass, c.gateReason, c.text);
      counts[cat.label] = (counts[cat.label] || 0) + 1;
    });
    const total = cards.length;
    return h(
      "aside",
      { className: "mos__sumrail" },
      h(
        "div",
        { className: "mos__sumrail-head" },
        h("b", null, total),
        h("span", null, "offen · nach Kategorie")
      ),
      h(
        "div",
        { className: "mos__sumrail-list" },
        SUMMARY_BUCKETS.map((b) => h(
          "div",
          { key: b.key, className: "mos__sumrail-row mos__sumrail-row--" + b.tone + (counts[b.key] || 0 ? "" : " is-zero") },
          h("span", { className: "mos__sumrail-ico" }, h(Icon, { name: b.icon, size: 14 })),
          h("span", { className: "mos__sumrail-k" }, b.key),
          h("span", { className: "mos__sumrail-n" }, counts[b.key] || 0)
        ))
      )
    );
  }
  function ApprovalsScene(props) {
    const a = props.approvals;
    const cards = a && Array.isArray(a.cards) ? a.cards : [];
    return h(
      "div",
      { className: "mos__apscene" },
      h(SummaryRail, { cards }),
      h(
        "div",
        { className: "mos__apscene-main" },
        h(ApprovalCenter, {
          approvals: a,
          load: props.load,
          scene: true,
          details: props.details,
          detailLoading: props.detailLoading,
          onLoadDetail: props.onLoadDetail
        })
      )
    );
  }
  function WorkspacePill(props) {
    const ws = props.workspace;
    const tag = WS_TAG[ws] || { label: props.label || ws || "—", tone: "neutral" };
    return h(
      "span",
      { className: "mos__wtag mos__wtag--" + tag.tone, title: props.title || ws || "" },
      ws === "gemischt" ? h(Icon, { name: "eye-off", size: 10 }) : null,
      props.label || tag.label
    );
  }
  const WISSEN_SOURCE = {
    gbrain: { icon: "brain", label: "gbrain" },
    qdrant: { icon: "database", label: "Mail" },
    docs: { icon: "file-text", label: "Dokumente" },
    paperless: { icon: "folder-open", label: "Paperless" },
    history: { icon: "history", label: "Sessions" },
    techniker: { icon: "wrench", label: "Technik-Wissen" }
  };
  function WissenResult(props) {
    const r = props.row;
    const src = WISSEN_SOURCE[r.quelle] || { icon: "circle", label: r.quelle || "?" };
    const hasLink = r.link && typeof r.link === "string";
    return h(
      "li",
      { className: "mos__wres" },
      h("span", { className: "mos__wres-ico" }, h(Icon, { name: src.icon, size: 16 })),
      h(
        "div",
        { className: "mos__wres-body" },
        h(
          "div",
          { className: "mos__wres-head" },
          h("span", { className: "mos__wres-title" }, r.titel || "—"),
          r.datum ? h("span", { className: "mos__wres-datum" }, r.datum) : null
        ),
        r.snippet ? h("p", { className: "mos__wres-snippet" }, String(r.snippet).slice(0, 220)) : null,
        h(
          "div",
          { className: "mos__wres-tags" },
          h("span", { className: "mos__wres-src" }, h(Icon, { name: src.icon, size: 11 }), src.label),
          h(WorkspacePill, { workspace: r.workspace, label: r.workspaceLabel }),
          r.typ ? h("span", { className: "mos__wres-typ" }, r.typ) : null,
          hasLink ? h("a", {
            className: "mos__wres-open",
            href: r.link,
            target: "_blank",
            rel: "noopener noreferrer",
            title: "Quelle öffnen (neuer Tab)"
          }, h(Icon, { name: "external-link", size: 12 }), "öffnen") : h(
            "span",
            { className: "mos__wres-nolink", title: "Kein direkter Link (z. B. Technik-Wissen aus dem Vektorindex)" },
            h(Icon, { name: "lock", size: 11 }),
            "kein Link"
          )
        )
      )
    );
  }
  function WissenScene(props) {
    const ov = props.data;
    const load = props.load;
    const q = props.query || "";
    const st = ov ? ov.state || "empty" : load === "loading" ? "loading" : load === "offline" ? "unavailable" : "idle";
    const rows = ov && Array.isArray(ov.rows) ? ov.rows : [];
    const onSearch = props.onSearch;
    useEffect(() => {
      const term = q.trim();
      if (term.length < 2) return void 0;
      const t = setTimeout(() => onSearch(term), 320);
      return () => clearTimeout(t);
    }, [q, onSearch]);
    const errs = ov && Array.isArray(ov.errors) ? ov.errors : [];
    let body;
    if (st === "idle" || !ov && load === "idle") {
      body = h(ZoneEmpty, {
        state: "empty",
        icon: "search",
        title: "Über alle Wissensquellen suchen",
        note: "gbrain · Mail · Dokumente · Paperless · Sessions · Technik-Wissen — jeder Treffer zeigt seinen Workspace."
      });
    } else if (load === "loading" || st === "loading") {
      body = h("ul", { className: "mos__wres-list" }, [0, 1, 2, 3].map((i) => h("li", { key: i, className: "mos__skrow" })));
    } else if (st === "unavailable" || st === "error" || load === "offline") {
      body = h(ZoneEmpty, {
        state: "unavailable",
        icon: "search-x",
        title: "Unified-Search nicht erreichbar",
        note: ov && ov.note || "Die föderierte Suche (:18055) antwortet nicht — bitte später erneut."
      });
    } else if (st === "partial" && !rows.length) {
      body = h(ZoneEmpty, {
        state: "empty",
        icon: "search",
        title: ov && ov.summary || "Suchbegriff eingeben",
        note: ov && ov.note
      });
    } else if (!rows.length) {
      body = h(ZoneEmpty, {
        state: "empty",
        icon: "search-x",
        title: ov && ov.summary || "Keine Treffer",
        note: ov && ov.note || "Andere Begriffe probieren."
      });
    } else {
      body = h("ul", { className: "mos__wres-list" }, rows.map((r, i) => h(WissenResult, { key: i, row: r })));
    }
    const historyNote = ov && ov.historyNote;
    return h(
      "div",
      { className: "mos__wissen" },
      h(
        "form",
        {
          className: "mos__wsearch",
          role: "search",
          onSubmit: (e) => {
            if (e && e.preventDefault) e.preventDefault();
            if (q.trim().length >= 2) onSearch(q.trim());
          }
        },
        h("span", { className: "mos__wsearch-ico" }, h(Icon, { name: "search", size: 18 })),
        h("input", {
          className: "mos__wsearch-input",
          type: "search",
          value: q,
          placeholder: "Suche über alle Wissensquellen …",
          "aria-label": "Wissenssuche",
          autoComplete: "off",
          onChange: (e) => props.onQuery(e.target.value)
        }),
        ov && rows.length ? h("span", { className: "mos__wsearch-count" }, rows.length + " Treffer") : null
      ),
      // Honest per-query banners: partial backend errors + the gemischt caption.
      st === "partial" && errs.length ? h(
        "div",
        { className: "mos__wbanner mos__wbanner--warn" },
        h(Icon, { name: "triangle-alert", size: 14 }),
        h("span", null, "Teil-Backends nicht erreichbar: " + errs.join("; "))
      ) : null,
      historyNote ? h(
        "div",
        { className: "mos__wbanner mos__wbanner--mixed" },
        h(Icon, { name: "eye-off", size: 14 }),
        h("span", null, historyNote)
      ) : null,
      body
    );
  }
  function KommRow(props) {
    const r = props.row;
    const dirIcon = r.direction === "in" ? "chevron-left" : r.direction === "out" ? "arrow-up-right" : r.icon || "circle";
    return h(
      "li",
      { className: "mos__krow mos--" + (r.accent || "cyan") },
      h("span", { className: "mos__krow-ico" }, h(Icon, { name: r.icon || dirIcon, size: 15 })),
      h(
        "div",
        { className: "mos__krow-body" },
        h("span", { className: "mos__krow-title" }, r.title || "—"),
        r.sub ? h("span", { className: "mos__krow-sub" }, r.sub) : null
      ),
      r.wartetSeit || r.datum ? h("span", { className: "mos__krow-when" }, freshnessLabel(r.wartetSeit || r.datum) || "") : r.statusLabel ? h("span", { className: "mos__status mos__status--" + (r.status || "waiting") }, r.statusLabel) : null
    );
  }
  function KommColumn(props) {
    const sub = props.sub || {};
    const st = sub.state || (props.load === "loading" ? "loading" : "unavailable");
    const rows = Array.isArray(sub.rows) ? sub.rows : [];
    const bad = st === "unavailable" || st === "error";
    return h(
      "section",
      { className: "mos__card mos__kcol" },
      h(
        "header",
        { className: "mos__card-head" },
        h(Icon, { name: props.icon, size: 16 }),
        h("span", { className: "mos__card-title" }, props.title),
        h(WorkspacePill, { workspace: props.workspace }),
        h(ZonePip, { state: st, source: sub.source, note: sub.note })
      ),
      h(
        "div",
        { className: "mos__kcol-body" },
        props.load === "loading" && !props.sub ? [0, 1, 2].map((i) => h("div", { key: i, className: "mos__skrow" })) : bad || !rows.length ? h(ZoneEmpty, {
          state: bad ? st : st === "partial" ? "partial" : "empty",
          icon: props.emptyIcon || "inbox",
          title: bad ? props.badTitle || "Quelle nicht erreichbar" : props.emptyTitle || "Keine Signale",
          note: sub.note
        }) : [
          // Optional mailbox tally (FreeScout).
          props.byMailbox && sub.byMailbox ? h(
            "div",
            { key: "mb", className: "mos__kcol-mb" },
            Object.keys(sub.byMailbox).map((mb) => h(
              "span",
              { key: mb, className: "mos__kcol-mbchip" },
              h("b", null, sub.byMailbox[mb]),
              mb
            ))
          ) : null,
          h("ul", { key: "rows", className: "mos__krow-list" }, rows.map((r, i) => h(KommRow, { key: i, row: r })))
        ]
      ),
      sub.note && rows.length ? h(
        "footer",
        { className: "mos__firma-foot mos__kcol-foot" },
        h(Icon, { name: "lock", size: 12 }),
        h("span", { className: "mos__firma-foot-t", title: sub.note }, sub.note)
      ) : null
    );
  }
  function KommunikationScene(props) {
    const ov = props.data;
    const load = props.load;
    const offline = load === "offline" || !ov && load !== "loading";
    const tg = ov && ov.telegram, vs = ov && ov.vorschlaege, fs = ov && ov.freescout;
    const fsOpen = fs && typeof fs.open === "number" ? fs.open : null;
    const vsPending = vs && typeof vs.pending === "number" ? vs.pending : null;
    return h(
      "div",
      { className: "mos__komm" },
      // The permanent, honest gate banner — no compose button exists in this scene.
      h(
        "div",
        { className: "mos__kbanner" },
        h(Icon, { name: "lock", size: 14 }),
        h("span", null, "Nur Signale — Versand (Mail/Telegram) ist freigabepflichtig (G7) und hier nicht möglich."),
        h("span", { className: "mos__kbanner-ro" }, h(Icon, { name: "eye", size: 12 }), "read-only")
      ),
      offline && !ov ? h(ZoneEmpty, {
        state: "unavailable",
        icon: "radio-tower",
        title: "Kommunikations-Projektion nicht erreichbar",
        note: "Signale offline — die Spalten erscheinen, sobald /kommunikation/overview antwortet."
      }) : h(
        "div",
        { className: "mos__kgrid" },
        h(KommColumn, {
          title: "Telegram",
          icon: "send",
          workspace: "private",
          load,
          sub: tg,
          emptyIcon: "send",
          emptyTitle: "Keine Telegram-Signale"
        }),
        h(KommColumn, {
          title: vsPending != null ? "Hermes-Vorschläge · " + vsPending : "Hermes-Vorschläge",
          icon: "shield-check",
          workspace: "company_signal",
          load,
          sub: vs,
          emptyIcon: "shield-check",
          emptyTitle: "Keine offenen Vorschläge"
        }),
        h(KommColumn, {
          title: fsOpen != null ? "FreeScout · " + fsOpen + " offen" : "FreeScout",
          icon: "inbox",
          workspace: "company_signal",
          load,
          sub: fs,
          byMailbox: true,
          emptyIcon: "inbox",
          emptyTitle: "Keine offenen Tickets",
          badTitle: "FreeScout-DB nicht erreichbar"
        })
      )
    );
  }
  function SessionRow(props) {
    const s = props.session;
    const running = s.status === "running";
    return h(
      "li",
      { className: "mos__sess mos--" + (running ? "emerald" : "cyan") },
      h("span", { className: "mos__sess-ico" }, h(Icon, { name: s.icon || "terminal", size: 15 })),
      h(
        "div",
        { className: "mos__sess-body" },
        h("span", { className: "mos__sess-name" }, s.name || "—"),
        h(
          "span",
          { className: "mos__sess-meta" },
          h(
            "span",
            { className: "mos__status mos__status--" + (running ? "verified" : "waiting") },
            running ? h(Icon, { name: "circle-check-big", size: 12 }) : h(Icon, { name: "clock", size: 12 }),
            s.status || "—"
          ),
          s.cwd ? h("span", { className: "mos__sess-cwd", title: s.cwd }, s.cwd) : null,
          s.startedAt ? h("span", { className: "mos__sess-when" }, freshnessLabel(s.startedAt) || "") : null
        )
      ),
      // Inventory is read-only. The shell command bar is the actual Jarvis control
      // path, so these buttons never pretend to mutate a broker session directly.
      h(
        "span",
        { className: "mos__sess-acts" },
        h(
          "button",
          {
            type: "button",
            disabled: true,
            "aria-disabled": "true",
            className: "mos__sess-act is-gated",
            title: "Diese Inventory-Karte ist nur lesend. Änderungen per Text oder Sprache an Jarvis geben."
          },
          h(Icon, { name: "eye", size: 12 }),
          "Inventar"
        ),
        h(
          "button",
          {
            type: "button",
            disabled: true,
            "aria-disabled": "true",
            className: "mos__sess-act is-gated",
            title: "Live-Arbeit erscheint unten automatisch, sobald Hermes delegiert."
          },
          h(Icon, { name: "waypoints", size: 12 }),
          "Live unten"
        )
      )
    );
  }
  function StrandCard(props) {
    const s = props.strand || {};
    const st = s.state || (props.load === "loading" ? "loading" : "unavailable");
    const sessions = Array.isArray(s.sessions) ? s.sessions : null;
    const rows = Array.isArray(s.rows) ? s.rows : null;
    const bad = st === "unavailable" || st === "error";
    const cur = s.currentMission;
    return h(
      "section",
      { className: "mos__card mos__strand" },
      h(
        "header",
        { className: "mos__card-head" },
        h(Icon, { name: s.icon || "bot", size: 16 }),
        h("span", { className: "mos__card-title" }, s.title || s.id),
        h(ZonePip, { state: st, observedAt: s.observedAt, source: s.source, note: s.note })
      ),
      h(
        "div",
        { className: "mos__strand-body" },
        cur ? h(
          "div",
          { className: "mos__strand-cur" },
          h("span", { className: "mos__strand-cur-k" }, "Aktuelle Mission"),
          h("span", { className: "mos__strand-cur-goal" }, cur.goal),
          cur.state ? h("span", { className: "mos__strand-cur-state" }, cur.state) : null
        ) : s.id !== "jarvis" ? null : h(
          "div",
          { className: "mos__strand-cur is-none" },
          h(Icon, { name: "circle", size: 12 }),
          "Keine Mission zugeordnet"
        ),
        props.load === "loading" && !props.strand ? [0, 1].map((i) => h("div", { key: i, className: "mos__skrow" })) : bad ? h(ZoneEmpty, {
          state: st,
          icon: "unplug",
          title: s.id === "jarvis" ? "mission.v2 nicht lesbar" : "Session-Broker :18087 nicht erreichbar",
          note: s.note
        }) : sessions != null ? sessions.length ? h("ul", { className: "mos__sess-list" }, sessions.map((x, i) => h(SessionRow, { key: i, session: x }))) : h(ZoneEmpty, {
          state: st === "partial" ? "partial" : "empty",
          icon: "terminal",
          title: st === "partial" ? "Broker erreichbar — Token/Scope fehlt" : "Keine aktiven Sessions",
          note: s.note
        }) : rows != null ? rows.length ? h("div", { className: "mos__strand-rows" }, rows.map((r, i) => h(LensRow, { key: i, row: r, index: i + 1 }))) : h(ZoneEmpty, { state: "empty", icon: "sparkles", title: "Keine Engineering-Missionen", note: s.note }) : h(ZoneEmpty, { state: "empty", icon: "circle", title: "Keine Daten" })
      ),
      h(
        "footer",
        { className: "mos__firma-foot mos__strand-foot" },
        h(Icon, { name: "lock", size: 12 }),
        h(
          "span",
          { className: "mos__firma-foot-t" },
          (s.source ? s.source : "read-only") + " · Steuerung via Jarvis"
        ),
        h("span", { className: "mos__firma-foot-ro" }, "Nur lesen")
      )
    );
  }
  function SessionsScene(props) {
    const ov = props.data;
    const load = props.load;
    const offline = load === "offline" || !ov && load !== "loading";
    const strands = ov && Array.isArray(ov.strands) ? ov.strands : [];
    const missions = ov && Array.isArray(ov.missions) ? ov.missions : [];
    const delegations = ov && ov.delegations;
    const liveRows = delegations && Array.isArray(delegations.rows) ? delegations.rows : [];
    if (offline && !ov) {
      return h(
        "div",
        { className: "mos__sessions" },
        h(ZoneEmpty, {
          state: "unavailable",
          icon: "waypoints",
          title: "Session-Projektion nicht erreichbar",
          note: "Read-Modelle offline — Stränge + mission.v2 erscheinen, sobald /agent-sessions/overview antwortet."
        })
      );
    }
    return h(
      "div",
      { className: "mos__sessions" },
      h(
        "div",
        { className: "mos__sgrid" },
        (strands.length ? strands : [{ id: "jarvis" }, { id: "codex" }, { id: "claude" }]).map((s) => h(StrandCard, { key: s.id, strand: ov ? s : null, load }))
      ),
      h(
        "section",
        { className: "mos__card mos__livework" },
        h(
          "header",
          { className: "mos__card-head" },
          h(Icon, { name: "activity", size: 16 }),
          h("span", { className: "mos__card-title" }, "Live-Arbeit der Agenten"),
          liveRows.length ? h("span", { className: "mos__appc-count" }, liveRows.length) : null,
          h(ZonePip, {
            state: delegations ? delegations.state || "empty" : load === "loading" ? "loading" : "empty",
            observedAt: delegations && delegations.observedAt,
            source: delegations && delegations.source,
            note: delegations && delegations.note
          })
        ),
        h(
          "div",
          { className: "mos__livework-body" },
          load === "loading" && !ov ? [0, 1].map((i) => h("div", { key: i, className: "mos__skrow" })) : liveRows.length ? liveRows.map((delegation) => h(LiveDelegation, {
            key: delegation.delegationId,
            delegation
          })) : h(ZoneEmpty, {
            state: delegations ? delegations.state || "empty" : "empty",
            icon: "activity",
            title: "Gerade keine delegierte Live-Arbeit",
            note: delegations && delegations.note || "Sobald Jarvis einen Subagenten startet, erscheinen Denken, Tools und Ergebnisse hier automatisch."
          })
        )
      ),
      h(
        "section",
        { className: "mos__card mos__slist" },
        h(
          "header",
          { className: "mos__card-head" },
          h(Icon, { name: "list-checks", size: 16 }),
          h("span", { className: "mos__card-title" }, "mission.v2 · Job-Liste"),
          missions.length ? h("span", { className: "mos__appc-count" }, missions.length) : null,
          h(ZonePip, {
            state: ov ? missions.length ? "fresh" : "empty" : load === "loading" ? "loading" : "unavailable",
            source: "mission.v2",
            note: ov && ov.note
          })
        ),
        h(
          "div",
          { className: "mos__slist-body" },
          load === "loading" && !ov ? [0, 1, 2].map((i) => h("div", { key: i, className: "mos__skrow" })) : missions.length ? missions.map((r, i) => h(LensRow, { key: i, row: r, index: i + 1 })) : h(ZoneEmpty, { state: "empty", icon: "list-checks", title: "Keine Missionen", note: ov && ov.note })
        )
      ),
      // One clear control model: observe here, direct Jarvis via the persistent
      // text/voice command bar below.
      h(
        "div",
        { className: "mos__kbanner mos__kbanner--sessions" },
        h(Icon, { name: "message-square", size: 14 }),
        h("span", null, ov && ov.controls && ov.controls.note || "Hier beobachten; Änderungen per Text oder Sprache an Jarvis geben.")
      )
    );
  }
  function LiveDelegation(props) {
    const delegation = props.delegation || {};
    const tasks = Array.isArray(delegation.tasks) ? delegation.tasks : [];
    const running = delegation.state === "running";
    return h(
      "article",
      { className: "mos__delegation" + (running ? " is-running" : "") },
      h(
        "div",
        { className: "mos__delegation-head" },
        h(
          "span",
          { className: "mos__delegation-state" },
          h(Icon, { name: running ? "activity" : "circle-check-big", size: 13 }),
          running ? "läuft live" : delegation.state || "fertig"
        ),
        h("span", { className: "mos__delegation-id" }, delegation.delegationId || "Delegation"),
        delegation.started ? h("span", { className: "mos__delegation-time" }, delegation.started) : null
      ),
      h(
        "div",
        { className: "mos__delegation-tasks" },
        tasks.map((task) => h(LiveTask, {
          key: String(task.index),
          task
        }))
      )
    );
  }
  function LiveTask(props) {
    const task = props.task || {};
    const events = Array.isArray(task.events) ? task.events : [];
    return h(
      "section",
      { className: "mos__livetask" },
      h(
        "div",
        { className: "mos__livetask-head" },
        h("span", { className: "mos__livetask-index" }, String((task.index || 0) + 1)),
        h("span", { className: "mos__livetask-goal" }, task.goal || "Delegierte Aufgabe"),
        h("span", { className: "mos__livetask-status is-" + (task.status || "unknown") }, task.status || "—")
      ),
      events.length ? h("ol", { className: "mos__liveevents" }, events.map((event, i) => h(
        "li",
        { key: i, className: "mos__liveevent is-" + (event.kind || "event") },
        h("time", null, event.time || ""),
        h("span", { className: "mos__liveevent-kind" }, liveEventLabel(event.kind)),
        h("span", { className: "mos__liveevent-text" }, event.text || "—")
      ))) : h(
        "div",
        { className: "mos__liveevent-empty" },
        h(Icon, { name: "clock", size: 12 }),
        "Startet — noch kein Ereignis geschrieben."
      )
    );
  }
  function liveEventLabel(kind) {
    return {
      step: "Schritt",
      status: "Status",
      tool: "Tool",
      result: "Ergebnis",
      evidence: "Evidenz"
    }[kind] || "Ereignis";
  }
  const ZIELE_RINGS = [
    { id: "jahr", label: "Jahresziel", icon: "target" },
    { id: "quartal", label: "Quartalsziel", icon: "calendar-days" },
    { id: "woche", label: "Wochenziel", icon: "circle-check-big" }
  ];
  const ZIELE_HABITS = [
    { id: "deepwork", label: "Deep Work", icon: "brain" },
    { id: "sport", label: "Sport", icon: "footprints" },
    { id: "lesen", label: "Lesen", icon: "book-open" },
    { id: "schlaf", label: "Schlaf", icon: "moon" }
  ];
  const ZIELE_LANE_ACCENT = { running: "emerald", waiting: "amber", error: "red", verified: "cyan" };
  const ZIELE_POLICY_ORDER = ["now", "today", "planned", "waiting", "later"];
  function ZieleRing(props) {
    const C = 2 * Math.PI * 52;
    return h(
      "div",
      { className: "mos__whoop-ring mos__zring is-connected" },
      h(
        "svg",
        { viewBox: "0 0 120 120", "aria-hidden": "true" },
        h("circle", { cx: 60, cy: 60, r: 52, className: "mos__whoop-track" }),
        h("circle", {
          cx: 60,
          cy: 60,
          r: 52,
          className: "mos__whoop-arc",
          style: {
            strokeDasharray: C + " " + C,
            strokeDashoffset: C * 0.25,
            transform: "rotate(-90deg)",
            transformOrigin: "60px 60px"
          }
        })
      ),
      h(
        "span",
        { className: "mos__whoop-center" },
        h(Icon, { name: props.icon || "target", size: 20 }),
        h("b", { className: "mos__zring-dash" }, "—")
      )
    );
  }
  function ZieleScene(props) {
    const ov = props.data;
    const load = props.load;
    const offline = load === "offline" || !ov && load !== "loading";
    const loading = load === "loading" && !ov;
    const policy = ov && ov.policy;
    const systems = ov && ov.systems;
    const gh = ov && ov.goalHierarchy;
    const habits = ov && ov.habits;
    const lanes = systems && Array.isArray(systems.lanes) ? systems.lanes : [];
    const displayLanes = policy && policy.ok && policy.displayLanes ? policy.displayLanes : null;
    const wip = policy && policy.ok ? policy.wipLimitNow : null;
    const sysState = systems ? systems.state || "empty" : loading ? "loading" : "unavailable";
    const sysBad = sysState === "unavailable" || sysState === "error";
    if (offline && !ov) {
      return h(
        "div",
        { className: "mos__ziele" },
        h(ZoneEmpty, {
          state: "unavailable",
          icon: "target",
          title: "Ziele-Projektion nicht erreichbar",
          note: "Read-Modelle offline — mission.v2 + Policy erscheinen, sobald /ziele/overview antwortet."
        })
      );
    }
    return h(
      "div",
      { className: "mos__ziele" },
      // Section 1 — goal-hierarchy rings (honestly empty: no source in the stack).
      h(
        "section",
        { className: "mos__zsec" },
        h(
          "div",
          { className: "mos__zsec-head" },
          h(Icon, { name: "target", size: 15 }),
          h("span", { className: "mos__zsec-title" }, "Ziel-Hierarchie"),
          h(ZonePip, {
            state: gh ? gh.state || "empty" : loading ? "loading" : "empty",
            source: gh && gh.source,
            note: gh && gh.note
          })
        ),
        h(
          "div",
          { className: "mos__zrings" },
          ZIELE_RINGS.map((r) => h(
            "div",
            { key: r.id, className: "mos__card mos__zringcard" },
            h(ZieleRing, { icon: r.icon }),
            h("span", { className: "mos__zringcard-label" }, r.label),
            h("span", { className: "mos__zringcard-empty" }, "Keine Quelle")
          ))
        ),
        gh && gh.note ? h(
          "p",
          { className: "mos__zsec-note" },
          h(Icon, { name: "circle-help", size: 13 }),
          gh.note
        ) : null
      ),
      // Section 2 — habit streak chips (honestly empty: no tracker in the stack).
      h(
        "section",
        { className: "mos__zsec" },
        h(
          "div",
          { className: "mos__zsec-head" },
          h(Icon, { name: "flame", size: 15 }),
          h("span", { className: "mos__zsec-title" }, "Gewohnheiten"),
          h(ZonePip, {
            state: habits ? habits.state || "empty" : loading ? "loading" : "empty",
            source: habits && habits.source,
            note: habits && habits.note
          })
        ),
        h(
          "div",
          { className: "mos__zhabits" },
          ZIELE_HABITS.map((hb) => h(
            "div",
            { key: hb.id, className: "mos__zhabit" },
            h("span", { className: "mos__zhabit-ico" }, h(Icon, { name: hb.icon, size: 15 })),
            h("span", { className: "mos__zhabit-label" }, hb.label),
            h("span", { className: "mos__zhabit-streak" }, "—"),
            h("span", { className: "mos__zhabit-unit" }, "kein Tracker")
          ))
        ),
        habits && habits.note ? h(
          "p",
          { className: "mos__zsec-note" },
          h(Icon, { name: "circle-help", size: 13 }),
          habits.note
        ) : null
      ),
      // Section 3 — Systeme / WIP board (real mission.v2 status buckets + policy).
      h(
        "section",
        { className: "mos__zsec mos__zsec--wip" },
        h(
          "div",
          { className: "mos__zsec-head" },
          h(Icon, { name: "list-checks", size: 15 }),
          h("span", { className: "mos__zsec-title" }, "Systeme · WIP"),
          systems && systems.summary && !sysBad ? h("span", { className: "mos__zsec-sum" }, systems.summary) : null,
          h(ZonePip, {
            state: sysState,
            observedAt: systems && systems.observedAt,
            source: systems && systems.source,
            note: systems && systems.note
          })
        ),
        // Policy priority-lane reference strip (real display_lanes from the YAML).
        displayLanes ? h(
          "div",
          { className: "mos__zpolicy" },
          h("span", { className: "mos__zpolicy-k" }, "Prioritäts-Lanes (Policy)"),
          ZIELE_POLICY_ORDER.filter((k) => displayLanes[k]).map((k) => h(
            "span",
            { key: k, className: "mos__zpolicy-lane" + (k === "now" ? " is-now" : "") },
            displayLanes[k],
            k === "now" && wip != null ? h("b", { className: "mos__zpolicy-wip" }, "WIP " + wip) : null
          )),
          h(
            "span",
            {
              className: "mos__zpolicy-note",
              title: "Die feinkörnige Prioritäts-Zuordnung ist control-plane-intern und nicht als Read-Endpunkt exponiert."
            },
            h(Icon, { name: "lock", size: 11 }),
            "Zuordnung gated"
          )
        ) : null,
        // Real WIP board — missions grouped by STATUS bucket (not priority).
        loading ? h("div", { className: "mos__zboard" }, [0, 1, 2, 3].map((i) => h("div", { key: i, className: "mos__card mos__zlane" }, h("div", { className: "mos__skrow" })))) : sysBad ? h(ZoneEmpty, { state: sysState, icon: "list-checks", title: "mission.v2 nicht lesbar", note: systems && systems.note }) : lanes.length ? h("div", { className: "mos__zboard" }, lanes.map((ln) => h(
          "div",
          { key: ln.id, className: "mos__card mos__zlane mos--" + (ZIELE_LANE_ACCENT[ln.id] || "cyan") },
          h(
            "header",
            { className: "mos__zlane-head" },
            h("span", { className: "mos__zlane-title" }, ln.label),
            h("span", { className: "mos__zlane-count" }, ln.count),
            ln.wipLimit != null ? h("span", { className: "mos__zlane-wip" }, "WIP " + ln.wipLimit) : null
          ),
          h(
            "div",
            { className: "mos__zlane-body" },
            ln.rows && ln.rows.length ? ln.rows.map((r, i) => h(LensRow, { key: i, row: r, index: i + 1 })) : h("div", { className: "mos__zlane-none" }, h(Icon, { name: "circle", size: 12 }), "leer")
          )
        ))) : h(ZoneEmpty, {
          state: "empty",
          icon: "list-checks",
          title: systems && systems.summary || "Keine Systeme",
          note: systems && systems.note
        }),
        h(
          "footer",
          { className: "mos__firma-foot mos__zsec-foot" },
          h(Icon, { name: "lock", size: 12 }),
          h(
            "span",
            { className: "mos__firma-foot-t" },
            (systems && systems.source ? "Quelle: " + systems.source : "mission.v2 + Policy") + (policy && policy.ok && policy.version ? " · Policy " + policy.version : "") + (policy && policy.ok && policy.policySha256 ? " · sha " + String(policy.policySha256).slice(0, 8) : "")
          ),
          h("span", { className: "mos__firma-foot-ro" }, "Nur lesen")
        )
      )
    );
  }
  function ReflexionCard(props) {
    const sub = props.sub || {};
    const st = props.loading ? "loading" : sub.state || "empty";
    const rows = Array.isArray(sub.rows) ? sub.rows : [];
    const bad = st === "unavailable" || st === "error";
    return h(
      "section",
      { className: "mos__card mos__reflcard" + (props.composer ? " mos__reflcard--journal" : "") },
      h(
        "header",
        { className: "mos__card-head" },
        h(Icon, { name: props.icon, size: 16 }),
        h("span", { className: "mos__card-title" }, props.title),
        h(WorkspacePill, { workspace: "private" }),
        h(ZonePip, { state: st, observedAt: sub.observedAt, source: sub.source, note: sub.note })
      ),
      h(
        "div",
        { className: "mos__reflcard-body" },
        props.loading ? [0, 1].map((i) => h("div", { key: i, className: "mos__skrow" })) : rows.length ? h("div", { className: "mos__strand-rows" }, rows.map((r, i) => h(LensRow, { key: i, row: r, index: i + 1 }))) : h(ZoneEmpty, {
          state: bad ? st : "empty",
          icon: props.emptyIcon || "inbox",
          title: props.emptyTitle,
          note: sub.note
        }),
        props.composer && !props.loading ? h(
          "div",
          { className: "mos__reflcompose" },
          h(
            "button",
            {
              type: "button",
              className: "mos__reflcompose-mic",
              disabled: true,
              "aria-disabled": "true",
              title: "Spracheingabe erst mit angebundenem Journal-Store — hier inaktiv."
            },
            h(Icon, { name: "mic", size: 16 })
          ),
          h("input", {
            type: "text",
            className: "mos__reflcompose-input",
            disabled: true,
            "aria-disabled": "true",
            placeholder: "Journal-Eintrag … (erst mit angebundenem Store)",
            "aria-label": "Journal-Eintrag (inaktiv)"
          }),
          h("span", { className: "mos__reflcompose-hint" }, h(Icon, { name: "lock", size: 11 }), "kein Schreibpfad")
        ) : null
      )
    );
  }
  function ReflexionScene(props) {
    const ov = props.data;
    const load = props.load;
    const offline = load === "offline" || !ov && load !== "loading";
    const loading = load === "loading" && !ov;
    const sections = ov && ov.sections;
    const connected = !!(ov && ov.connected);
    if (offline && !ov) {
      return h(
        "div",
        { className: "mos__refl" },
        h(ZoneEmpty, {
          state: "unavailable",
          icon: "notebook-pen",
          title: "Reflexions-Projektion nicht erreichbar",
          note: "Read-Modelle offline — Journal/Entscheidungen/Erkenntnisse erscheinen, sobald /reflexion/overview antwortet."
        })
      );
    }
    return h(
      "div",
      { className: "mos__refl" },
      // Privacy banner — strictly private, no compose/send, no substitution.
      h(
        "div",
        { className: "mos__kbanner mos__refl-banner" },
        h(Icon, { name: "lock", size: 14 }),
        h("span", null, "Strikt privat · nur lesen — kein Versand, keine Ersatzdaten aus mission.v2/Approvals."),
        h("span", { className: "mos__kbanner-ro" }, h(Icon, { name: "eye", size: 12 }), "read-only")
      ),
      h(
        "div",
        { className: "mos__reflgrid" },
        h(ReflexionCard, {
          title: "Journal",
          icon: "notebook-pen",
          composer: true,
          sub: sections && sections.journal,
          loading,
          emptyIcon: "notebook-pen",
          emptyTitle: connected ? "Kein Eintrag" : "Kein Journal-Store angebunden"
        }),
        h(ReflexionCard, {
          title: "Entscheidungsprotokoll",
          icon: "list-checks",
          sub: sections && sections.decisions,
          loading,
          emptyIcon: "list-checks",
          emptyTitle: connected ? "Keine Entscheidungen erfasst" : "Kein Entscheidungs-Store"
        }),
        h(ReflexionCard, {
          title: "Lernerkenntnisse",
          icon: "lightbulb",
          sub: sections && sections.insights,
          loading,
          emptyIcon: "sparkles",
          emptyTitle: connected ? "Keine Erkenntnisse erfasst" : "Kein Erkenntnis-Store"
        })
      ),
      ov && ov.note ? h(
        "p",
        { className: "mos__zsec-note mos__refl-note" },
        h(Icon, { name: "circle-help", size: 13 }),
        ov.note
      ) : null
    );
  }
  function parseRecovery(body) {
    if (!body || body.state !== "fresh") return null;
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const rec = rows.find((r) => /recovery/i.test(r.title || ""));
    if (!rec || typeof rec.value !== "string") return null;
    const m = /(\d+(?:\.\d+)?)/.exec(rec.value);
    return m ? Number(m[1]) : null;
  }
  function Sparkline(props) {
    const vals = props.values || [];
    const W = 280, H2 = 66, pad = 7, n = vals.length;
    const present = vals.filter((v) => v != null);
    const x = (i) => n <= 1 ? W / 2 : pad + i * (W - 2 * pad) / (n - 1);
    const y = (v) => H2 - pad - v / 100 * (H2 - 2 * pad);
    let d = "", pen = false;
    vals.forEach((v, i) => {
      if (v == null) {
        pen = false;
        return;
      }
      d += (pen ? " L" : " M") + x(i).toFixed(1) + " " + y(v).toFixed(1);
      pen = true;
    });
    return h(
      "div",
      { className: "mos__spark" },
      h(
        "svg",
        { viewBox: "0 0 " + W + " " + H2, className: "mos__spark-svg", preserveAspectRatio: "none", "aria-hidden": "true" },
        h("path", { d: d.trim(), className: "mos__spark-line", fill: "none" }),
        vals.map((v, i) => v == null ? null : h("circle", { key: i, cx: x(i), cy: y(v), r: 2.6, className: "mos__spark-dot" }))
      ),
      h(
        "div",
        { className: "mos__spark-legend" },
        present.length ? h("span", null, Math.round(Math.min.apply(null, present)) + "–" + Math.round(Math.max.apply(null, present)) + "%") : null,
        h("span", null, present.length + " Tage")
      )
    );
  }
  function GesundheitTrend(props) {
    const sub = props.sub || {};
    const st = props.loading ? "loading" : sub.state || "unavailable";
    const series = Array.isArray(sub.series) ? sub.series : [];
    const pts = series.map((d) => typeof d.recoveryScore === "number" ? d.recoveryScore : null);
    const hasData = pts.some((v) => v != null);
    const bad = st === "unavailable" || st === "error";
    return h(
      "section",
      { className: "mos__card mos__gestrend" },
      h(
        "header",
        { className: "mos__card-head" },
        h(Icon, { name: "trending-up", size: 16 }),
        h("span", { className: "mos__card-title" }, "Recovery-Trend · 7 Tage"),
        h(ZonePip, { state: st, observedAt: sub.observedAt, source: sub.source, note: sub.note })
      ),
      h(
        "div",
        { className: "mos__gestrend-body" },
        props.loading ? h("div", { className: "mos__skrow" }) : hasData ? h(Sparkline, { values: pts }) : h(ZoneEmpty, {
          state: bad ? st : "empty",
          icon: "trending-up",
          title: st === "partial" ? "Trend nur mit internem Token" : "Kein Trend verfügbar",
          note: sub.note
        })
      )
    );
  }
  function GesundheitSide(props) {
    const sub = props.sub || {};
    const st = props.loading ? "loading" : sub.state || "unavailable";
    const bad = st === "unavailable" || st === "error";
    return h(
      "section",
      { className: "mos__card mos__gesside" },
      h(
        "header",
        { className: "mos__card-head" },
        h(Icon, { name: props.icon, size: 16 }),
        h("span", { className: "mos__card-title" }, props.title),
        h(WorkspacePill, { workspace: "private" }),
        h(ZonePip, { state: st, source: sub.source, note: sub.note })
      ),
      h(
        "div",
        { className: "mos__gesside-body" },
        props.loading ? h("div", { className: "mos__skrow" }) : h(ZoneEmpty, {
          state: bad ? "unavailable" : "empty",
          icon: props.icon,
          title: sub.summary || props.title + ": kein Connector",
          note: sub.note
        })
      )
    );
  }
  function GesundheitScene(props) {
    const ov = props.data;
    const load = props.load;
    const offline = load === "offline" || !ov && load !== "loading";
    const loading = load === "loading" && !ov;
    const cards = ov && ov.cards;
    const body = cards && cards.body;
    const trend = cards && cards.trend;
    const training = cards && cards.training;
    const nutrition = cards && cards.nutrition;
    if (offline && !ov) {
      return h(
        "div",
        { className: "mos__ges" },
        h(ZoneEmpty, {
          state: "unavailable",
          icon: "heart-pulse",
          title: "Gesundheits-Projektion nicht erreichbar",
          note: "Read-Modelle offline — WHOOP-Werte erscheinen, sobald /gesundheit/overview antwortet."
        })
      );
    }
    const bodyState = body ? body.state || "unavailable" : loading ? "loading" : "unavailable";
    const bodyBad = bodyState === "unavailable" || bodyState === "error";
    const rows = body && Array.isArray(body.rows) ? body.rows : [];
    const recPct = parseRecovery(body);
    const partial = bodyState === "partial";
    return h(
      "div",
      { className: "mos__ges" },
      // Honest partial banner — connected but detail values need the gated token.
      partial ? h(
        "div",
        { className: "mos__kbanner mos__ges-banner" },
        h(Icon, { name: "shield-check", size: 14 }),
        h("span", null, body && body.note || "WHOOP verbunden — Detailwerte erst mit internem Token (gated). Keine erfundenen Werte."),
        h("span", { className: "mos__kbanner-ro" }, h(Icon, { name: "eye", size: 12 }), "read-only")
      ) : null,
      h(
        "div",
        { className: "mos__gesgrid" },
        // Hero — Recovery ring + honest stat rows (or connected-note under partial).
        h(
          "section",
          { className: "mos__card mos__geshero" },
          h(
            "header",
            { className: "mos__card-head" },
            h(Icon, { name: "heart-pulse", size: 16 }),
            h("span", { className: "mos__card-title" }, "Körper / WHOOP"),
            h(WorkspacePill, { workspace: "private" }),
            h(ZonePip, {
              state: bodyState,
              observedAt: body && body.observedAt,
              source: body && body.source,
              note: body && body.note
            })
          ),
          loading ? h("div", { className: "mos__geshero-body" }, [0, 1, 2].map((i) => h("div", { key: i, className: "mos__skrow" }))) : bodyBad ? h(ZoneEmpty, { state: bodyState, icon: "heart-pulse", title: "WHOOP nicht erreichbar", note: body && body.note }) : h(
            "div",
            { className: "mos__geshero-body" },
            h(
              "div",
              { className: "mos__geshero-ring" },
              h(WhoopRing, { module: { _demo: false, _state: recPct != null ? "fresh" : "partial", _recovery: recPct } }),
              body && body.summary ? h("span", { className: "mos__geshero-sum" }, body.summary) : null
            ),
            h(
              "div",
              { className: "mos__geshero-stats" },
              rows.length ? rows.map((r, i) => h(FirmaMetric, { key: i, row: r })) : h(ZoneEmpty, { state: "empty", icon: "heart-pulse", title: "Keine Detailwerte", note: body && body.note })
            )
          )
        ),
        h(GesundheitTrend, { sub: trend, loading }),
        h(GesundheitSide, { title: "Training", sub: training, loading, icon: "dumbbell" }),
        h(GesundheitSide, { title: "Ernährung", sub: nutrition, loading, icon: "utensils" })
      ),
      h(
        "footer",
        { className: "mos__firma-foot mos__ges-foot" },
        h(Icon, { name: "lock", size: 12 }),
        h(
          "span",
          { className: "mos__firma-foot-t" },
          "Quelle: WHOOP-Connector :18090 · privat" + (ov && ov.observedAt ? " · Stand " + (freshnessLabel(ov.observedAt) || "gerade") : "")
        ),
        h("span", { className: "mos__firma-foot-ro" }, "Nur lesen")
      )
    );
  }
  const MAC_ICON = {
    focus_window: "app-window",
    open_surface: "monitor",
    arrange_widgets: "layout-grid",
    show_file: "file-text"
  };
  const MODE_ICON = {
    standalone: "monitor-check",
    fullscreen: "monitor-check",
    "minimal-ui": "app-window",
    browser: "app-window"
  };
  const FRONTDOOR_TONE = { reader: "blue", writer: "amber", unknown: "muted" };
  const FRONTDOOR_ICON = { dashboard: "monitor", telegram: "send-horizontal", hermes_app: "circle-help" };
  function MacActionRow(props) {
    const a = props.action;
    const st = props.state || {};
    const phase = st.phase || "idle";
    const pv = st.data;
    const open = phase === "preview" && !!pv;
    return h(
      "li",
      { className: "mos__macrow" + (open ? " mos--open" : "") },
      h(
        "button",
        {
          type: "button",
          className: "mos__macrow-btn",
          onClick: () => props.onPropose(a.id),
          "aria-expanded": open ? "true" : "false",
          "aria-label": a.label + " vorschlagen (nur Vorschau)"
        },
        h("span", { className: "mos__macrow-ico" }, h(Icon, { name: MAC_ICON[a.id] || a.icon || "app-window", size: 17 })),
        h(
          "span",
          { className: "mos__macrow-body" },
          h("span", { className: "mos__macrow-title" }, a.label),
          h("span", { className: "mos__macrow-target" }, h(Icon, { name: "arrow-up-right", size: 11 }), a.target)
        ),
        open ? h(
          "span",
          { className: "mos__macrow-sel", title: "aufgeklappte Beispiel-Vorschau (Dry-Run)" },
          h(Icon, { name: "flask-conical", size: 11 }),
          "Beispiel"
        ) : h(
          "span",
          { className: "mos__macrow-lock", title: "Ausführung folgt über Control-Plane-Capability (gated)" },
          h(Icon, { name: "lock", size: 11 }),
          "deferred"
        )
      ),
      // Preview / deferred detail — only after a click (dry-run), never live.
      phase === "loading" ? h("div", { className: "mos__macrow-prev mos__skrow" }) : phase === "error" ? h(
        "div",
        { className: "mos__macrow-prev mos__macrow-prev--err" },
        h(Icon, { name: "triangle-alert", size: 12 }),
        st.note || "Vorschau nicht möglich."
      ) : phase === "preview" && pv ? h(
        "div",
        { className: "mos__macrow-prev" },
        h(
          "div",
          { className: "mos__macrow-prevhead" },
          h(
            "span",
            { className: "mos__pip mos__pip--amber" },
            h(Icon, { name: "flask-conical", size: 11 }),
            "Dry-Run · nichts gesendet"
          ),
          h(
            "span",
            { className: "mos__macrow-gate" },
            h(Icon, { name: "shield-check", size: 11 }),
            pv.predictedGate && pv.predictedGate.gateClass || "device_propose"
          )
        ),
        h(
          "dl",
          { className: "mos__macrow-kv" },
          h(
            "div",
            null,
            h("dt", null, "Intent"),
            h("dd", null, pv.intent && pv.intent.action + " → " + pv.intent.target || "—")
          ),
          h(
            "div",
            null,
            h("dt", null, "Capability"),
            h("dd", null, pv.intent && pv.intent.requiredCapabilities && pv.intent.requiredCapabilities.join(", ") || "—")
          ),
          pv.plan && pv.plan.greenCapability ? h("div", null, h("dt", null, "Bestehend"), h("dd", null, pv.plan.greenCapability)) : null
        ),
        h(
          "p",
          { className: "mos__macrow-note" },
          h(Icon, { name: "lock", size: 11 }),
          pv.plan && pv.plan.capabilityDetail || "Ausführung über Control-Plane-Capability folgt."
        )
      ) : null
    );
  }
  function BetriebScene(props) {
    const ov = props.data;
    const load = props.load;
    const env = props.displayEnv || {};
    const pwa = props.pwaStatus || {};
    const offline = load === "offline" || !ov && load !== "loading";
    const loading = load === "loading" && !ov;
    const [mac, setMac] = useState({});
    const onPropose = useCallback((id) => {
      setMac((m) => ({ ...m, [id]: { phase: "loading" } }));
      sdkPost(MAC_PROPOSE_API, { action: id, dryRun: true }).then((r) => {
        if (!r || r.ok === false) {
          setMac((m) => ({ ...m, [id]: { phase: "error", note: r && r.note || "Vorschau nicht möglich." } }));
          return;
        }
        setMac((m) => ({ ...m, [id]: { phase: "preview", data: r } }));
      }).catch(() => setMac((m) => ({ ...m, [id]: { phase: "error", note: "Vorschau nicht erreichbar." } })));
    }, []);
    if (offline && !ov) {
      return h(
        "div",
        { className: "mos__betr" },
        h(ZoneEmpty, {
          state: "unavailable",
          icon: "monitor",
          title: "Betriebs-Projektion nicht erreichbar",
          note: "Read-Modelle offline — Anzeige/Mac-Steuerung/Frontdoors erscheinen, sobald /betrieb/overview antwortet."
        })
      );
    }
    const mc = ov && ov.macControl;
    const macActions = mc && Array.isArray(mc.actions) ? mc.actions : [];
    const fd = ov && ov.frontdoors;
    const channels = fd && Array.isArray(fd.channels) ? fd.channels : [];
    const gaps = fd && Array.isArray(fd.gaps) ? fd.gaps : [];
    const shared = fd && fd.shared || {};
    const rc = ov && ov.reconnect;
    const sources = rc && Array.isArray(rc.sources) ? rc.sources : [];
    const dm = ov && ov.displayMode;
    const swLabel = {
      registered: "registriert",
      unavailable: "nicht möglich",
      unsupported: "nicht unterstützt",
      unknown: "…"
    }[pwa.sw || "unknown"];
    return h(
      "div",
      { className: "mos__betr" },
      h(
        "div",
        { className: "mos__betrgrid" },
        // ---- 1. Anzeige-Modus + PWA + Reconnect --------------------------------
        h(
          "section",
          { className: "mos__card mos__betr-display" },
          h(
            "header",
            { className: "mos__card-head" },
            h(Icon, { name: env.standalone ? "monitor-check" : "monitor", size: 16 }),
            h("span", { className: "mos__card-title" }, "Anzeige & Verbindung"),
            h(WorkspacePill, { workspace: "private" }),
            h(ZonePip, {
              state: loading ? "loading" : dm && dm._prov && dm._prov.state || "partial",
              observedAt: dm && dm._prov && dm._prov.observedAt,
              source: "clientseitig erkannt",
              note: dm && dm.note
            })
          ),
          // Drei gleichwertige Anzeige-Modi. Der clientseitig ERKANNTE ist aktiv
          // (violett); nicht verfügbare bleiben sichtbar als locked + Kurzgrund.
          // Kein echtes Umschalten aus dem Plugin — reiner Status (M5: read-only).
          function() {
            const modes = dm && Array.isArray(dm.modes) && dm.modes.length ? dm.modes : [{ id: "standalone", label: "Kiosk" }, { id: "browser", label: "Browser-Tab" }];
            const installable = !!(dm && dm.pwa && dm.pwa.installableFromPlugin);
            const activeId = modes.some((m) => m.id === env.mode) ? env.mode : env.standalone ? "standalone" : "browser";
            const needsHost = (id) => id !== "browser" && !installable;
            const hasLocked = modes.some((m) => m.id !== activeId && needsHost(m.id));
            return [
              h(
                "div",
                { key: "sw", className: "mos__betr-moderow" },
                h(
                  "div",
                  { className: "mos__betr-modeswitch", role: "group", "aria-label": "Anzeige-Modus" },
                  modes.map((m) => {
                    const on = m.id === activeId;
                    const locked = !on && needsHost(m.id);
                    return h(
                      "span",
                      {
                        key: m.id,
                        className: "mos__betr-mode mos--" + (on ? "on" : locked ? "locked" : "idle"),
                        title: m.hint || m.label,
                        "aria-current": on ? "true" : void 0
                      },
                      h(Icon, { name: on ? "monitor-check" : locked ? "lock" : MODE_ICON[m.id] || "app-window", size: 14 }),
                      m.label
                    );
                  })
                ),
                h(
                  "span",
                  {
                    className: "mos__betr-conn mos--" + (env.online === false ? "off" : "on"),
                    title: "navigator.onLine"
                  },
                  h(Icon, { name: env.online === false ? "wifi-off" : "wifi", size: 13 }),
                  env.online === false ? "offline" : "online"
                ),
                h(
                  "span",
                  { className: "mos__betr-vis", title: "document.visibilityState" },
                  h(Icon, { name: "eye", size: 13 }),
                  env.visibility || "visible"
                )
              ),
              hasLocked ? h(
                "p",
                { key: "hint", className: "mos__betr-modehint" },
                h(Icon, { name: "info", size: 11 }),
                "Aktiver Modus clientseitig erkannt. Kiosk/PWA brauchen ein Host-Manifest (Runbook) — hier ehrlich als „nicht verfügbar“ markiert, nicht schaltbar."
              ) : null
            ];
          }(),
          // Sichtbare Reconnect-Erfolgsmeldung (Endnutzer-Statusaussage), zusätzlich
          // zur technischen RECONNECT-kv-Zeile weiter unten.
          rc && rc.total ? h(
            "div",
            { className: "mos__betr-recon mos--" + (rc.reachableCount === rc.total ? "on" : "off") },
            h(Icon, { name: rc.reachableCount === rc.total ? "circle-check-big" : "loader", size: 13 }),
            rc.reachableCount === rc.total ? "Verbunden · Zustand nach Reconnect sofort wiederhergestellt" : "Teil-verbunden · " + rc.reachableCount + "/" + rc.total + " Read-Modelle erreichbar"
          ) : null,
          h(
            "dl",
            { className: "mos__betr-kv" },
            h(
              "div",
              null,
              h("dt", null, "PWA-Manifest"),
              h(
                "dd",
                null,
                h(Icon, { name: pwa.manifest ? "circle-check-big" : "flask-conical", size: 12 }),
                pwa.manifest ? "in <head> injiziert" : "nicht injiziert"
              )
            ),
            h(
              "div",
              null,
              h("dt", null, "Service-Worker"),
              h("dd", null, h(Icon, { name: pwa.sw === "registered" ? "circle-check-big" : "flask-conical", size: 12 }), swLabel)
            ),
            h(
              "div",
              null,
              h("dt", null, "Reconnect"),
              h(
                "dd",
                null,
                h(Icon, { name: "refresh-cw", size: 12 }),
                rc && rc.strategy ? rc.strategy.join(" · ") : "online · focus · visibilitychange"
              )
            )
          ),
          // read-model reachability strip (honest, real probe)
          h(
            "ul",
            { className: "mos__betr-sources" },
            loading ? [0, 1, 2, 3].map((i) => h("li", { key: i, className: "mos__skrow" })) : sources.map((s) => h(
              "li",
              { key: s.id, className: "mos__betr-src mos--" + (s.reachable ? "on" : "off") },
              h("span", { className: "mos__pip-dot", "aria-hidden": "true" }),
              h("span", { className: "mos__betr-src-l" }, s.label),
              h("span", { className: "mos__betr-src-s" }, s.reachable ? "erreichbar" : "offline")
            ))
          ),
          h(
            "p",
            { className: "mos__betr-hint" },
            h(Icon, { name: "info", size: 12 }),
            dm && dm.pwa && dm.pwa.note || "Voll installierbares PWA/Kiosk braucht zusätzlich einen Host-<link rel=manifest> (Runbook)."
          )
        ),
        // ---- 2. Mac-Steuerung (typed · propose-only · deferred) ----------------
        h(
          "section",
          { className: "mos__card mos__betr-mac" },
          h(
            "header",
            { className: "mos__card-head" },
            h(Icon, { name: "cpu", size: 16 }),
            h("span", { className: "mos__card-title" }, "Mac-Steuerung"),
            h(
              "span",
              { className: "mos__pip mos__pip--gated", title: "propose-only" },
              h(Icon, { name: "shield-check", size: 11 }),
              "propose-only"
            ),
            h(ZonePip, {
              state: loading ? "loading" : "fresh",
              observedAt: mc && mc._prov && mc._prov.observedAt,
              source: "typisierte Aktionen"
            })
          ),
          h(
            "div",
            { className: "mos__kbanner mos__betr-macbanner" },
            h(Icon, { name: "lock", size: 14 }),
            h("span", null, mc && mc.safety || "Das Plugin führt NIE selbst etwas aus — kein Shell/exec/ssh. Jede Aktion ist ein typisierter Vorschlag (dry-run); Ausführung folgt gated."),
            h("span", { className: "mos__kbanner-ro" }, h(Icon, { name: "eye", size: 12 }), "kein Autopilot")
          ),
          loading ? h("ul", { className: "mos__maclist" }, [0, 1, 2, 3].map((i) => h("li", { key: i, className: "mos__skrow" }))) : h(
            "ul",
            { className: "mos__maclist" },
            macActions.map((a) => h(MacActionRow, { key: a.id, action: a, state: mac[a.id], onPropose }))
          ),
          h(
            "footer",
            { className: "mos__firma-foot mos__betr-macfoot" },
            h(Icon, { name: "git-branch", size: 12 }),
            h(
              "span",
              { className: "mos__firma-foot-t" },
              "Route: " + (mc && mc.proposeRoute || "/betrieb/mac/propose") + " · dry-run"
            ),
            h("span", { className: "mos__firma-foot-ro" }, "Ausführung gated")
          )
        ),
        // ---- 3. Drei-Frontdoor (shared job truth, honest) ----------------------
        h(
          "section",
          { className: "mos__card mos__betr-fd" },
          h(
            "header",
            { className: "mos__card-head" },
            h(Icon, { name: "waypoints", size: 16 }),
            h("span", { className: "mos__card-title" }, "Drei Frontdoors · geteilter Kontext"),
            h(ZonePip, {
              state: loading ? "loading" : fd && fd._prov && fd._prov.state || "fresh",
              observedAt: fd && fd._prov && fd._prov.observedAt,
              source: fd && fd._prov && fd._prov.source
            })
          ),
          h(
            "ul",
            { className: "mos__fdlist" },
            (loading ? [] : channels).map((c) => h(
              "li",
              { key: c.id, className: "mos__fdrow mos--" + (FRONTDOOR_TONE[c.role] || "muted") },
              h("span", { className: "mos__fdrow-ico" }, h(Icon, { name: FRONTDOOR_ICON[c.id] || "circle", size: 16 })),
              h(
                "div",
                { className: "mos__fdrow-body" },
                h(
                  "div",
                  { className: "mos__fdrow-head" },
                  h("span", { className: "mos__fdrow-name" }, c.label),
                  h(
                    "span",
                    { className: "mos__fdrow-role mos--" + (FRONTDOOR_TONE[c.role] || "muted") },
                    h(Icon, { name: c.observed ? "link" : "unlink", size: 10 }),
                    c.role === "reader" ? "Leser" : c.role === "writer" ? "Schreiber" : "nicht beobachtet"
                  )
                ),
                h("p", { className: "mos__fdrow-det" }, c.detail)
              )
            ))
          ),
          loading ? h("div", { className: "mos__skrow" }, "") : h(
            "div",
            { className: "mos__fdshared" },
            h("span", null, h("b", null, shared.missions != null ? shared.missions : "—"), " Missionen (mission.v2)"),
            h("span", null, h("b", null, shared.approvalsPending != null ? shared.approvalsPending : "—"), " Approval-Cards offen"),
            h("span", null, h("b", null, shared.missionsWithCorrelation != null ? shared.missionsWithCorrelation : "—"), " mit channel_correlations")
          ),
          !loading && shared.note ? h("p", { className: "mos__fd-sharednote" }, h(Icon, { name: "info", size: 12 }), shared.note) : null,
          !loading && gaps.length ? h(
            "div",
            { className: "mos__fdgaps" },
            h("span", { className: "mos__fdgaps-h" }, h(Icon, { name: "triangle-alert", size: 12 }), "Ehrliche Lücken (nicht verschwiegen)"),
            h("ul", null, gaps.map((g, i) => h(
              "li",
              { key: g.id || i },
              g.count != null ? h("span", { className: "mos__fdgaps-c" }, g.count) : null,
              h("span", null, g.text)
            )))
          ) : null
        )
      ),
      h(
        "footer",
        { className: "mos__firma-foot mos__betr-foot" },
        h(Icon, { name: "lock", size: 12 }),
        h(
          "span",
          { className: "mos__firma-foot-t" },
          "Betrieb = 24/7 · Anzeige clientseitig · Mac propose-only (kein Shell/exec) · Frontdoors nur lesen" + (ov && ov.observedAt ? " · Stand " + (freshnessLabel(ov.observedAt) || "gerade") : "")
        ),
        h("span", { className: "mos__firma-foot-ro" }, "Nur lesen")
      )
    );
  }
  const VOICE_PHASE = {
    idle: { label: "Bereit", tone: "cyan" },
    permission: { label: "Mikrofon prüfen", tone: "amber" },
    preparing: { label: "Mission vorbereiten", tone: "amber" },
    connecting: { label: "Verbindung aufbauen", tone: "amber" },
    listening: { label: "Ich höre zu", tone: "emerald" },
    speaking: { label: "Jarvis antwortet", tone: "cyan" },
    reconnecting: { label: "Verbindung wird wiederhergestellt", tone: "amber" },
    ended: { label: "Gespräch beendet", tone: "muted" },
    error: { label: "Verbindung unterbrochen", tone: "red" }
  };
  function transcriptUpsert(setRows, role, key, text, done) {
    if (!text) return;
    setRows((prev) => {
      const rows = prev.slice();
      const idx = rows.findIndex((row) => row.key === key && row.role === role);
      if (idx >= 0) {
        rows[idx] = { ...rows[idx], text: done ? text : rows[idx].text + text, done: !!done };
      } else {
        rows.push({ key, role, text, done: !!done, at: (/* @__PURE__ */ new Date()).toISOString() });
      }
      return rows.slice(-24);
    });
  }
  function RealtimeVoiceDeck(props) {
    const [meta, setMeta] = useState(null);
    const [phase, setPhase] = useState("idle");
    const [confirm, setConfirm] = useState(false);
    const [inlineId, setInlineId] = useState("");
    const [missionId, setMissionId] = useState("");
    const [model, setModel] = useState("");
    const [error, setError] = useState("");
    const [transcript, setTranscript] = useState([]);
    const [control, setControl] = useState(null);
    const peerRef = useRef(null);
    const streamRef = useRef(null);
    const audioRef = useRef(null);
    const channelRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    const confirmRef = useRef(null);
    const inlineRef = useRef("");
    inlineRef.current = inlineId;
    const loadMeta = useCallback(() => {
      sdkRequestJSON(VOICE_STATUS_API, "GET").then((result) => {
        const body = result.body || {};
        setMeta(body);
        if (props.onStatus) props.onStatus(body);
      }).catch(() => {
        const body = { ok: false, state: "unavailable" };
        setMeta(body);
        if (props.onStatus) props.onStatus(body);
      });
    }, [props.onStatus]);
    useEffect(() => {
      loadMeta();
      if (typeof window === "undefined") return void 0;
      const open = () => setConfirm(true);
      window.addEventListener(VOICE_OPEN_EVENT, open);
      window.addEventListener("online", loadMeta);
      return () => {
        window.removeEventListener(VOICE_OPEN_EVENT, open);
        window.removeEventListener("online", loadMeta);
      };
    }, [loadMeta]);
    useEffect(() => {
      if (!confirm || typeof document === "undefined") return void 0;
      const dialog = confirmRef.current;
      const previous = document.activeElement;
      const focusable = dialog ? Array.from(dialog.querySelectorAll("button:not(:disabled)")) : [];
      if (focusable.length) focusable[0].focus();
      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          setConfirm(false);
          return;
        }
        if (event.key !== "Tab" || focusable.length < 2) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("keydown", onKeyDown);
        if (previous && typeof previous.focus === "function") previous.focus();
      };
    }, [confirm]);
    const releaseMedia = useCallback(() => {
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerRef.current) {
        try {
          peerRef.current.close();
        } catch (_e) {
        }
      }
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch (_e) {
        }
        audioRef.current.srcObject = null;
      }
      streamRef.current = null;
      peerRef.current = null;
      channelRef.current = null;
      audioRef.current = null;
    }, []);
    const hangup = useCallback((silent) => {
      const handle = inlineRef.current;
      releaseMedia();
      inlineRef.current = "";
      if (!handle) {
        setPhase("ended");
        return Promise.resolve();
      }
      setPhase("ended");
      setInlineId("");
      return sdkRequestJSON(VOICE_CONTROL_API, "POST", {
        inlineId: handle,
        action: "hangup"
      }).then((result) => {
        if (!silent && (!result.ok || !result.body || result.body.ok === false)) {
          setError("Hangup konnte nicht eindeutig bestätigt werden. Keine automatische Wiederholung.");
          setPhase("error");
        }
      }).catch(() => {
        if (!silent) {
          setError("Hangup konnte nicht eindeutig bestätigt werden. Keine automatische Wiederholung.");
          setPhase("error");
        }
      });
    }, [releaseMedia]);
    useEffect(() => () => {
      const handle = inlineRef.current;
      releaseMedia();
      if (handle) {
        sdkRequestJSON(VOICE_CONTROL_API, "POST", {
          inlineId: handle,
          action: "hangup"
        }).catch(() => {
        });
      }
    }, [releaseMedia]);
    useEffect(() => {
      if (!inlineId || !["listening", "speaking", "reconnecting"].includes(phase)) return void 0;
      const poll = () => {
        sdkRequestJSON(VOICE_CONTROL_API, "POST", {
          inlineId,
          action: "status"
        }).then((result) => {
          const body = sdkResponseBody(result);
          setControl((previous) => ({ ...previous || {}, ...body }));
          if (!result.ok || body.ok === false || body.status === "reconcile_required") {
            setError("Hermes-Sideband meldet einen unklaren Zustand. Keine automatische Wiederholung.");
            releaseMedia();
            setPhase("error");
          }
        }).catch(() => {
          setError("Hermes-Sideband ist nicht erreichbar.");
          releaseMedia();
          setPhase("error");
        });
      };
      const timer = window.setInterval(poll, 4e3);
      return () => window.clearInterval(timer);
    }, [inlineId, phase, releaseMedia]);
    const handleRealtimeEvent = useCallback((event) => {
      const type = String(event && event.type || "");
      if (type === "input_audio_buffer.speech_started") {
        setPhase("listening");
        return;
      }
      if (type === "input_audio_buffer.speech_stopped") {
        setPhase("connecting");
        return;
      }
      if (type.includes("input_audio_transcription.delta")) {
        transcriptUpsert(setTranscript, "mikael", event.item_id || "input", String(event.delta || ""), false);
        return;
      }
      if (type.includes("input_audio_transcription.completed")) {
        transcriptUpsert(setTranscript, "mikael", event.item_id || "input", String(event.transcript || ""), true);
        return;
      }
      if (type === "response.output_audio_transcript.delta") {
        setPhase("speaking");
        transcriptUpsert(setTranscript, "jarvis", event.item_id || event.response_id || "response", String(event.delta || ""), false);
        return;
      }
      if (type === "response.output_audio_transcript.done") {
        transcriptUpsert(setTranscript, "jarvis", event.item_id || event.response_id || "response", String(event.transcript || ""), true);
        return;
      }
      if (type === "response.function_call_arguments.done") {
        setControl((prev) => ({ ...prev || {}, lastTool: event.name || "Hermes-Tool" }));
        return;
      }
      if (type === "response.done") {
        setPhase("listening");
        return;
      }
      if (type === "error") {
        const err = event.error || {};
        setError(String(err.code || err.message || "Realtime-Fehler"));
        setPhase("error");
      }
    }, []);
    const begin = useCallback(async () => {
      setConfirm(false);
      setError("");
      setTranscript([]);
      setControl(null);
      if (typeof RTCPeerConnection !== "function" || !navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
        setError("Dieser Browser unterstützt den sicheren WebRTC-Mikrofonpfad nicht. Es wurde nichts reserviert.");
        setPhase("error");
        return;
      }
      setPhase("permission");
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }
        });
      } catch (_e) {
        setError("Mikrofonzugriff wurde nicht erteilt. Es wurde nichts reserviert.");
        setPhase("error");
        return;
      }
      streamRef.current = stream;
      setPhase("preparing");
      let prepared;
      try {
        const result = await sdkRequestJSON(VOICE_PREPARE_API, "POST", {
          purpose: "Jarvis Realtime im MIKAEL OS Voice Command Deck"
        });
        prepared = sdkResponseBody(result);
        if (!result.ok || prepared.ok !== true || !prepared.inlineId) {
          throw new Error(prepared.message || "Realtime konnte nicht vorbereitet werden.");
        }
      } catch (err) {
        releaseMedia();
        setError(String(err && err.message || "Realtime konnte nicht vorbereitet werden."));
        setPhase("error");
        loadMeta();
        return;
      }
      setInlineId(prepared.inlineId);
      inlineRef.current = prepared.inlineId;
      setMissionId(prepared.missionId || "");
      setModel(prepared.model || "");
      setPhase("connecting");
      try {
        const peer = new RTCPeerConnection();
        peerRef.current = peer;
        const remoteAudio = document.createElement("audio");
        remoteAudio.autoplay = true;
        remoteAudio.playsInline = true;
        remoteAudio.onplaying = () => setPhase("speaking");
        remoteAudio.onpause = () => setPhase("listening");
        remoteAudio.onended = () => setPhase("listening");
        audioRef.current = remoteAudio;
        peer.ontrack = (event) => {
          remoteAudio.srcObject = event.streams[0];
          Promise.resolve(remoteAudio.play()).catch(() => {
          });
        };
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));
        const channel = peer.createDataChannel("oai-events");
        channelRef.current = channel;
        channel.addEventListener("message", (message) => {
          try {
            handleRealtimeEvent(JSON.parse(message.data));
          } catch (_e) {
          }
        });
        channel.addEventListener("open", () => setPhase("listening"));
        channel.addEventListener("close", () => {
          if (inlineRef.current) setPhase("reconnecting");
        });
        peer.onconnectionstatechange = () => {
          const state2 = peer.connectionState;
          if (state2 === "connected") {
            if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
            setPhase("listening");
          } else if (state2 === "disconnected") {
            setPhase("reconnecting");
            if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = window.setTimeout(() => {
              if (peer.connectionState !== "connected") {
                setError("WebRTC-Verbindung blieb unterbrochen. Neu verbinden braucht eine bestätigte neue Reservierung.");
                releaseMedia();
                setPhase("error");
              }
            }, 5e3);
          } else if (state2 === "failed" || state2 === "closed") {
            setError("WebRTC-Verbindung ist beendet. Neu verbinden braucht eine bestätigte neue Reservierung.");
            releaseMedia();
            setPhase("error");
          }
        };
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        const sessionResult = await sdkRequestJSON(VOICE_SESSION_API, "POST", {
          inlineId: prepared.inlineId,
          sdp: offer.sdp
        });
        const session = sdkResponseBody(sessionResult);
        if (!sessionResult.ok || session.ok !== true || !session.sdp) {
          throw new Error(session.message || "WebRTC-Session wurde nicht bestätigt.");
        }
        await peer.setRemoteDescription({ type: "answer", sdp: session.sdp });
        setPhase("listening");
      } catch (err) {
        releaseMedia();
        setError(String(err && err.message || "Realtime-Verbindung fehlgeschlagen."));
        setPhase("error");
      }
    }, [handleRealtimeEvent, loadMeta, releaseMedia]);
    const sendText = useCallback((event) => {
      if (event && event.preventDefault) event.preventDefault();
      const text = String(props.command || "").trim();
      if (!text) return;
      const channel = channelRef.current;
      if (inlineId && channel && channel.readyState === "open") {
        const itemKey = "typed_" + Date.now();
        transcriptUpsert(setTranscript, "mikael", itemKey, text, true);
        channel.send(JSON.stringify({
          type: "conversation.item.create",
          item: { type: "message", role: "user", content: [{ type: "input_text", text }] }
        }));
        channel.send(JSON.stringify({ type: "response.create", response: { output_modalities: ["audio"] } }));
        props.onCommand("");
        setPhase("connecting");
        return;
      }
      props.onTextFallback(event);
    }, [inlineId, props.command, props.onCommand, props.onTextFallback]);
    const state = VOICE_PHASE[phase] || VOICE_PHASE.idle;
    const policy = meta && meta.policy || {};
    const hasReservation = typeof policy.reservationUsd === "number" && Number.isFinite(policy.reservationUsd);
    const reservation = hasReservation ? policy.reservationUsd : NaN;
    const canStart = meta && meta.state === "ready" && hasReservation && reservation >= 0;
    const active = ["permission", "preparing", "connecting", "listening", "speaking", "reconnecting"].includes(phase);
    const statusText = meta == null ? "Realtime-Status wird geladen" : meta.state === "ready" ? "WebRTC + Hermes-Sideband bereit" : meta.state === "disabled" ? "Realtime ist noch nicht freigeschaltet" : "Realtime-Lane nicht erreichbar";
    return h(
      "section",
      { className: "mos__vcd-voice", "aria-label": "Jarvis Realtime Gespräch" },
      h(
        "div",
        { className: "mos__vcd-hero" },
        h(
          "div",
          { className: "mos__vcd-orbwrap mos--" + state.tone },
          h(Orb, { label: false }),
          h(
            "div",
            { className: "mos__vcd-orblabel", role: "status", "aria-live": "polite" },
            h("strong", null, "JARVIS"),
            h("span", null, state.label)
          )
        )
      ),
      h(
        "div",
        { className: "mos__vcd-connection" },
        h(
          "span",
          { className: "mos__pip mos__pip--" + (meta && meta.state === "ready" ? "verified" : meta == null ? "muted" : "red") },
          h("span", { className: "mos__pip-dot", "aria-hidden": "true" }),
          statusText
        ),
        model || policy.model ? h("span", { className: "mos__vcd-model" }, model || policy.model) : null,
        missionId ? h("span", { className: "mos__vcd-mission", title: missionId }, "Mission " + missionId.slice(-8)) : null
      ),
      h(
        "div",
        { className: "mos__vcd-transcript", role: "log", "aria-live": "polite", "aria-label": "Live-Transkript" },
        transcript.length ? transcript.map((row) => h(
          "div",
          { key: row.key + row.role, className: "mos__vcd-turn is-" + row.role },
          h("span", { className: "mos__vcd-turnwho" }, row.role === "jarvis" ? "Jarvis" : "Mikael"),
          h("p", null, row.text)
        )) : h(
          "div",
          { className: "mos__vcd-empty" },
          h(Icon, { name: "audio-lines", size: 18 }),
          h("span", null, active ? "Live-Transkript beginnt mit dem ersten Satz." : "Noch kein Realtime-Transkript."),
          h("small", null, "Text und Telegram bleiben dieselbe Jarvis-/Memory-Lane.")
        )
      ),
      error ? h(
        "div",
        { className: "mos__vcd-error", role: "alert" },
        h(Icon, { name: "triangle-alert", size: 15 }),
        error
      ) : null,
      control && control.lastTool ? h(
        "div",
        { className: "mos__vcd-tool" },
        h(Icon, { name: "wrench", size: 13 }),
        "Hermes-Sideband · " + control.lastTool
      ) : null,
      h(
        "div",
        { className: "mos__vcd-controls" },
        active ? h("button", {
          type: "button",
          className: "mos__vcd-mic is-active",
          onClick: () => hangup(false),
          disabled: !inlineId,
          "aria-label": "Realtime-Gespräch beenden"
        }, h(Icon, { name: "square", size: 22 })) : h("button", {
          type: "button",
          className: "mos__vcd-mic",
          onClick: () => setConfirm(true),
          disabled: !canStart,
          "aria-label": "Jarvis Realtime starten"
        }, h(Icon, { name: "mic", size: 24 })),
        h(
          "div",
          { className: "mos__vcd-controlcopy" },
          h("strong", null, active ? state.label : "Bereit — jetzt sprechen"),
          h("span", null, active ? "Du kannst Jarvis jederzeit unterbrechen." : "WebRTC · Live-Transkript · serverseitige Tools")
        ),
        phase === "error" ? h(
          "button",
          { type: "button", className: "mos__vcd-reconnect", onClick: () => {
            hangup(true).finally(() => {
              loadMeta();
              setConfirm(true);
            });
          } },
          h(Icon, { name: "refresh-cw", size: 14 }),
          "Neu verbinden"
        ) : null
      ),
      h(
        "form",
        { className: "mos__vcd-command", onSubmit: sendText },
        h("input", {
          type: "text",
          value: props.command,
          onChange: (event) => props.onCommand(event.target.value),
          placeholder: "Nachricht an Jarvis …",
          "aria-label": "Nachricht an Jarvis"
        }),
        h(
          "button",
          { type: "submit", "aria-label": "Nachricht senden" },
          h(Icon, { name: "send-horizontal", size: 18 })
        )
      ),
      h(
        "div",
        { className: "mos__vcd-quick" },
        ["Status der aktiven Mission", "Was braucht meine Freigabe?", "Zeige Systemgesundheit"].map((label) => h("button", { key: label, type: "button", onClick: () => props.onCommand(label) }, label))
      ),
      confirm ? h(
        "div",
        { ref: confirmRef, className: "mos__vcd-confirm", role: "dialog", "aria-modal": "true", "aria-label": "Realtime-Nutzung bestätigen" },
        h(
          "div",
          { className: "mos__vcd-confirmbox" },
          h("span", { className: "mos__vcd-confirmico" }, h(Icon, { name: "mic", size: 22 })),
          h(
            "div",
            null,
            h("strong", null, "Realtime-Sitzung starten?"),
            h(
              "p",
              null,
              "Externe OpenAI-Nutzung. Reservierung laut Live-Policy: ",
              h("b", null, Number.isFinite(reservation) ? reservation.toFixed(2).replace(".", ",") + " $" : "nicht verfügbar"),
              ". Mikrofon wird vor der Reservierung geprüft."
            ),
            h("small", null, (policy.model || "Modell nicht verfügbar") + " · " + (policy.voice || "Voice nicht verfügbar") + " · Hermes-Sideband")
          ),
          h(
            "div",
            { className: "mos__vcd-confirmactions" },
            h("button", { type: "button", onClick: () => setConfirm(false) }, "Abbrechen"),
            h(
              "button",
              { type: "button", className: "is-primary", onClick: begin, disabled: !canStart },
              "Starten · " + (Number.isFinite(reservation) ? reservation.toFixed(2).replace(".", ",") + " $" : "nicht verfügbar")
            )
          )
        )
      ) : null
    );
  }
  function MissionAgentCard(props) {
    const strand = props.strand;
    const sessions = Array.isArray(strand.sessions) ? strand.sessions : [];
    const rows = Array.isArray(strand.rows) ? strand.rows : [];
    const current = strand.currentMission || rows[0] || sessions[0] || null;
    const state = strand.state || "unavailable";
    const running = current && (current.state === "running" || current.status === "running") || sessions.some((item) => item.status === "running");
    const label = running ? "Läuft" : state === "fresh" ? "Bereit" : state === "empty" ? "Keine aktive Mission" : "Nicht geprüft";
    const goal = current && (current.goal || current.title || current.name);
    return h(
      "article",
      { className: "mos__vcd-agent mos--" + (running ? "running" : state) },
      h("span", { className: "mos__vcd-agentico" }, h(Icon, { name: strand.icon || "bot", size: 17 })),
      h(
        "div",
        { className: "mos__vcd-agentbody" },
        h("strong", null, props.label || strand.title || strand.id),
        h("span", { title: goal || "" }, goal || strand.note || "Keine Live-Daten")
      ),
      h("span", { className: "mos__vcd-agentstate" }, label)
    );
  }
  function ActiveMissionsPanel(props) {
    const strands = props.sessions && Array.isArray(props.sessions.strands) ? props.sessions.strands : [];
    const byId = {};
    strands.forEach((strand) => {
      byId[strand.id] = strand;
    });
    const items = [
      byId.codex || { id: "codex", title: "Codex", icon: "terminal", state: props.load === "loading" ? "loading" : "unavailable" },
      byId.claude || { id: "claude", title: "Claude", icon: "bot", state: props.load === "loading" ? "loading" : "unavailable" },
      byId.executor || { id: "executor", title: "Executor", icon: "rocket", state: props.load === "loading" ? "loading" : "unavailable" }
    ];
    return h(
      "section",
      { className: "mos__vcd-panel mos__vcd-missions" },
      h("header", null, h("span", null, "Aktive Missionen"), h(ZonePip, {
        state: props.load === "loading" ? "loading" : props.load === "ready" ? "fresh" : "unavailable",
        source: "mission.v2 + Session-Broker + Executor-Evidenz"
      })),
      h(
        "div",
        { className: "mos__vcd-agentlist" },
        items.map((strand) => h(MissionAgentCard, {
          key: strand.id,
          strand,
          label: strand.id === "executor" ? "Executor" : strand.id === "claude" ? "Claude" : "Codex"
        }))
      ),
      h(
        "button",
        { type: "button", className: "mos__vcd-open", onClick: props.onOpen },
        "Agenten-Leitstand öffnen",
        h(Icon, { name: "arrow-right", size: 14 })
      )
    );
  }
  function MissionEvidencePanel(props) {
    const missions = props.sessions && Array.isArray(props.sessions.missions) ? props.sessions.missions : [];
    const mission = missions[0] || null;
    const fields = mission ? [
      { id: "goal", label: "Ziel", value: mission.goal || mission.title },
      { id: "plan", label: "Plan", value: Array.isArray(mission.plan) && mission.plan.length ? mission.plan.join(" · ") : null },
      { id: "step", label: "Schritt", value: mission.currentStep },
      { id: "tool", label: "Tool", value: mission.tool || mission.owner },
      { id: "result", label: "Ergebnis", value: mission.result },
      { id: "evidence", label: "Evidenz", value: Array.isArray(mission.evidence) && mission.evidence.length ? mission.evidence.join(" · ") : null }
    ] : [];
    return h(
      "section",
      { className: "mos__vcd-panel mos__vcd-evidence" },
      h(
        "header",
        null,
        h("span", null, "Missions-Evidenz"),
        h(
          "button",
          { type: "button", onClick: props.onOpen, "aria-label": "Missionsleitstand öffnen" },
          h(Icon, { name: "arrow-up-right", size: 14 })
        )
      ),
      mission ? h(
        "div",
        { className: "mos__vcd-evidencegrid" },
        fields.map((field) => h(
          "div",
          { key: field.id, className: "mos__vcd-evidenceitem" },
          h("span", null, field.label),
          h("p", { title: field.value || "" }, field.value || "Noch kein Beleg")
        ))
      ) : h(
        "p",
        { className: "mos__vcd-panel-empty" },
        props.load === "loading" ? "Missionen werden geladen …" : "Keine Mission in der Live-Projektion."
      )
    );
  }
  function CalendarTasksPanel(props) {
    const calendar = props.byId.kalender;
    const tasks = props.byId.tasks;
    const cards = [
      { id: "calendar", title: "Kalender", icon: "calendar-days", item: calendar },
      { id: "tasks", title: "Aufgaben", icon: "list-todo", item: tasks }
    ];
    return h(
      "section",
      { className: "mos__vcd-panel mos__vcd-calendar" },
      h("header", null, h("span", null, "Kalender & Aufgaben")),
      cards.map((card) => {
        const item = card.item;
        const live = item && !item._demo;
        const first = live && Array.isArray(item._rows) ? item._rows[0] : null;
        return h(
          "button",
          { key: card.id, type: "button", className: "mos__vcd-summary", onClick: props.onOpen },
          h("span", { className: "mos__vcd-summaryico" }, h(Icon, { name: card.icon, size: 17 })),
          h(
            "span",
            { className: "mos__vcd-summarybody" },
            h("strong", null, card.title),
            h("small", null, first ? first.title + (first.value ? " · " + first.value : "") : "Keine Live-Daten")
          ),
          h(ZonePip, { state: live ? item._state : "unavailable", source: live ? item._source : "Kein Live-Read-Modell" })
        );
      })
    );
  }
  function ApprovalGatePanel(props) {
    const approvals = props.approvals;
    const cards = approvals && Array.isArray(approvals.cards) ? approvals.cards : [];
    const available = !!approvals;
    const gates = [
      { id: "money", label: "Geld", icon: "banknote", match: /money|geld|zahlung|sevdesk|rechnung|invoice/i },
      { id: "outbound", label: "Kundenversand", icon: "send", match: /customer|kunde|versand|outbound|mail/i },
      { id: "schema", label: "Truth-Schema", icon: "database", match: /schema|migration/i }
    ];
    return h(
      "section",
      { className: "mos__vcd-panel mos__vcd-gates" },
      h(
        "header",
        null,
        h("span", null, "Gezielte Freigaben"),
        h(
          "button",
          { type: "button", onClick: props.onOpen, "aria-label": "Freigaben öffnen" },
          h(Icon, { name: "arrow-up-right", size: 14 })
        )
      ),
      gates.map((gate) => {
        const count = cards.filter((card) => gate.match.test(
          [card.gateClass, card.gateReason, card.text, card.action].filter(Boolean).join(" ")
        )).length;
        return h(
          "button",
          { key: gate.id, type: "button", className: "mos__vcd-gaterow", onClick: props.onOpen },
          h("span", { className: "mos__vcd-gateico" }, h(Icon, { name: gate.icon, size: 16 })),
          h("strong", null, gate.label),
          h(
            "span",
            { className: "mos__vcd-gatecount" },
            available ? count ? count + " offen" : "0 offen" : "Nicht geprüft"
          )
        );
      })
    );
  }
  function SystemHealthPanel(props) {
    const sources = props.betrieb && props.betrieb.reconnect && Array.isArray(props.betrieb.reconnect.sources) ? props.betrieb.reconnect.sources : [];
    const rows = [
      { id: "mikael", label: "Mikael OS", reachable: props.loadState === "ready" },
      {
        id: "voice",
        label: "Realtime / Voice",
        reachable: props.voice && props.voice.state === "ready",
        checked: !!props.voice
      },
      ...sources.slice(0, 4).map((source) => ({
        id: source.id,
        label: source.label,
        reachable: !!source.reachable,
        checked: true
      }))
    ];
    return h(
      "section",
      { className: "mos__vcd-panel mos__vcd-health" },
      h(
        "header",
        null,
        h("span", null, "System & Services"),
        h(
          "button",
          { type: "button", onClick: props.onOpen, "aria-label": "Betrieb öffnen" },
          h(Icon, { name: "arrow-up-right", size: 14 })
        )
      ),
      h(
        "div",
        { className: "mos__vcd-healthlist" },
        rows.map((row) => h(
          "div",
          { key: row.id, className: "mos__vcd-healthrow" },
          h(Icon, { name: row.id === "voice" ? "radio-tower" : row.id === "mikael" ? "sparkles" : "server", size: 14 }),
          h("span", null, row.label),
          h(
            "b",
            { className: row.reachable ? "is-ok" : "is-warn" },
            row.checked === false ? "Nicht geprüft" : row.reachable ? "Live" : "Nicht erreichbar"
          )
        ))
      )
    );
  }
  function surfaceState(item, fallback) {
    if (!item) return "unavailable";
    return item.state || item._state || fallback || "unavailable";
  }
  function SurfaceCatalog(props) {
    const firmaCards = props.firma && Array.isArray(props.firma.cards) ? props.firma.cards : [];
    const firmaById = {};
    firmaCards.forEach((card) => {
      firmaById[card.id] = card;
    });
    const fs = props.komm && props.komm.freescout;
    const sourceEntries = [
      {
        id: "fsm",
        label: "FSM",
        icon: "clipboard-list",
        state: firmaCards.length ? firmaCards.some((c) => ["error", "unavailable"].includes(c.state)) ? "partial" : "fresh" : "unavailable",
        action: "Firma",
        evidence: "FSM-Cockpit + read-only Projektionen",
        scene: "firma"
      },
      {
        id: "freescout",
        label: "FreeScout",
        icon: "inbox",
        state: surfaceState(fs),
        action: "Kommunikation",
        evidence: fs && fs.source,
        scene: "kommunikation"
      },
      {
        id: "paperless",
        label: "Paperless",
        icon: "folder-check",
        state: surfaceState(firmaById.dokumente),
        action: "Dokumente",
        evidence: firmaById.dokumente && firmaById.dokumente.source,
        scene: "firma"
      },
      {
        id: "calendar",
        label: "Kalender",
        icon: "calendar-days",
        state: surfaceState(props.byId.kalender && !props.byId.kalender._demo ? props.byId.kalender : null),
        action: "Timeline",
        evidence: props.byId.kalender && props.byId.kalender._source,
        scene: "timeline"
      },
      {
        id: "tasks",
        label: "Aufgaben",
        icon: "list-todo",
        state: surfaceState(props.byId.tasks && !props.byId.tasks._demo ? props.byId.tasks : null),
        action: "Missionen",
        evidence: props.byId.tasks && props.byId.tasks._source,
        scene: "ziele"
      },
      {
        id: "personal",
        label: "Personal",
        icon: "users",
        state: "unavailable",
        action: "Computer Use",
        evidence: "Kein nativer Read-Adapter",
        fallback: true
      },
      {
        id: "vehicles",
        label: "Fahrzeuge",
        icon: "truck",
        state: "unavailable",
        action: "Computer Use",
        evidence: "Kein nativer Read-Adapter",
        fallback: true
      },
      {
        id: "stock",
        label: "Lager",
        icon: "package",
        state: "unavailable",
        action: "Computer Use",
        evidence: "Kein nativer Read-Adapter",
        fallback: true
      },
      {
        id: "time",
        label: "Arbeitszeit",
        icon: "clock",
        state: "unavailable",
        action: "Computer Use",
        evidence: "Kein nativer Read-Adapter",
        fallback: true
      },
      {
        id: "devices",
        label: "Geräte",
        icon: "monitor",
        state: props.betrieb ? "partial" : "unavailable",
        action: "Betrieb",
        evidence: "Typisierte Geräte-Lane",
        scene: "betrieb"
      },
      {
        id: "agents",
        label: "Agenten",
        icon: "bot",
        state: props.sessions ? "fresh" : "unavailable",
        action: "Leitstand",
        evidence: "mission.v2 + Session-Broker",
        scene: "sessions"
      }
    ];
    const metaFor = (state) => {
      if (state === "fresh") return { label: "Live", tone: "verified" };
      if (state === "partial" || state === "stale") return { label: "Teilweise", tone: "blue" };
      if (state === "empty") return { label: "Leer", tone: "muted" };
      return { label: "Computer Use", tone: "amber" };
    };
    return h(
      "section",
      { className: "mos__vcd-surfaces" },
      h(
        "header",
        null,
        h(
          "div",
          null,
          h("span", null, "Surface-Katalog"),
          h("small", null, "Native API zuerst · sichtbarer Computer-Use-Fallback")
        ),
        h("span", { className: "mos__vcd-catalogcount" }, sourceEntries.filter((entry) => entry.state === "fresh").length + " live")
      ),
      h(
        "div",
        { className: "mos__vcd-surfacegrid" },
        sourceEntries.map((entry) => {
          const meta = metaFor(entry.state);
          const progress = entry.state === "fresh" ? "Verfügbar" : entry.state === "partial" || entry.state === "stale" ? "Teilweise" : entry.state === "empty" ? "Keine Signale" : "Fallback";
          return h(
            "button",
            {
              key: entry.id,
              type: "button",
              className: "mos__vcd-surface",
              onClick: () => entry.scene ? props.onOpen(entry.scene) : props.onComputerUse(entry),
              title: [entry.evidence, "Aktion: " + entry.action].filter(Boolean).join(" · ")
            },
            h("span", { className: "mos__vcd-surfaceico" }, h(Icon, { name: entry.icon, size: 16 })),
            h("span", { className: "mos__vcd-surfacename" }, entry.label),
            h(
              "span",
              { className: "mos__pip mos__pip--" + meta.tone },
              h("span", { className: "mos__pip-dot", "aria-hidden": "true" }),
              meta.label
            ),
            h("span", { className: "mos__vcd-surfaceaction" }, "Aktion · " + entry.action),
            h("span", { className: "mos__vcd-surfaceprogress" }, "Fortschritt · " + progress),
            h(
              "span",
              { className: "mos__vcd-surfaceevidence" },
              "Evidenz · " + (entry.evidence || "nicht verfügbar")
            )
          );
        })
      )
    );
  }
  function sourceStateMeta(state) {
    if (state === "fresh") return { label: "Live", tone: "verified" };
    if (state === "partial" || state === "stale") return { label: "Teilweise", tone: "blue" };
    if (state === "empty") return { label: "Leer", tone: "muted" };
    if (state === "loading") return { label: "Lädt …", tone: "muted" };
    return { label: "Nicht verbunden", tone: "amber" };
  }
  function LifeAtlas(props) {
    const areas = props.life && Array.isArray(props.life.areas) ? props.life.areas : [];
    return h(
      "section",
      { className: "mos__life-section", "aria-labelledby": "mos-life-title" },
      h(
        "header",
        { className: "mos__life-heading" },
        h(
          "div",
          null,
          h("span", { className: "mos__life-kicker" }, "Persönliches System"),
          h("h2", { id: "mos-life-title" }, "Alle Lebensbereiche — klar getrennt"),
          h("p", null, "Mikael OS ordnet. Die jeweilige Quelle bleibt Wahrheit. Jarvis liest, steuert und belegt.")
        ),
        h(
          "span",
          { className: "mos__life-count" },
          areas.length ? areas.filter((area) => area.lifecycle === "active").length + " aktiv · " + areas.length + " gesamt" : props.load === "loading" ? "Lädt …" : "Nicht erreichbar"
        )
      ),
      areas.length ? h(
        "div",
        { className: "mos__life-grid" },
        areas.map((area) => {
          const state = sourceStateMeta(area.state);
          return h(
            "article",
            { key: area.id, className: "mos__life-card is-" + area.lifecycle },
            h(
              "div",
              { className: "mos__life-cardtop" },
              h("span", { className: "mos__life-icon" }, h(Icon, { name: area.icon || "layers", size: 18 })),
              h(
                "div",
                { className: "mos__life-title" },
                h("strong", null, area.title),
                h("span", null, area.lifecycle === "active" ? "Aktiver Bereich" : "Erschließbar")
              ),
              h(
                "span",
                { className: "mos__pip mos__pip--" + state.tone },
                h("span", { className: "mos__pip-dot", "aria-hidden": "true" }),
                state.label
              )
            ),
            h(
              "div",
              { className: "mos__life-coverage" },
              h("span", null, area.connectedSources + "/" + area.sourceCount + " Quellen verbunden"),
              h(
                "span",
                { className: "mos__life-bar", "aria-label": area.coverage + " Prozent Quellenabdeckung" },
                h("span", { style: { width: Math.max(0, Math.min(100, area.coverage || 0)) + "%" } })
              )
            ),
            h(
              "p",
              { className: "mos__life-sources", title: (area.sourceLabels || []).join(" · ") },
              (area.sourceLabels || []).length ? area.sourceLabels.join(" · ") : "Noch keine Quelle"
            ),
            h(
              "div",
              { className: "mos__life-actions" },
              area.scene ? h(
                "button",
                { type: "button", onClick: () => props.onOpen(area.scene) },
                h(Icon, { name: "panels-top-left", size: 13 }),
                "Ansehen"
              ) : null,
              h(
                "button",
                {
                  type: "button",
                  className: "is-jarvis",
                  onClick: () => props.onJarvis(area.jarvisPrompt)
                },
                h(Icon, { name: "sparkles", size: 13 }),
                "Mit Jarvis"
              ),
              h(
                "button",
                {
                  type: "button",
                  className: "is-manage",
                  onClick: () => props.onJarvis(area.managePrompt),
                  "aria-label": area.title + " verwalten"
                },
                h(Icon, { name: "settings", size: 13 })
              )
            )
          );
        })
      ) : h(
        "div",
        { className: "mos__vcd-empty" },
        h(Icon, { name: "layers", size: 18 }),
        h("span", null, props.load === "loading" ? "Lebensbereiche werden geladen …" : "Life-Atlas nicht erreichbar."),
        h("small", null, "Keine Ersatz- oder Beispieldaten.")
      )
    );
  }
  function DashboardObservatory(props) {
    const dashboards = props.life && Array.isArray(props.life.dashboards) ? props.life.dashboards : [];
    return h(
      "section",
      { className: "mos__life-section mos__dashboards", "aria-labelledby": "mos-dashboards-title" },
      h(
        "header",
        { className: "mos__life-heading" },
        h(
          "div",
          null,
          h("span", { className: "mos__life-kicker" }, "Oberflächenatlas"),
          h("h2", { id: "mos-dashboards-title" }, "Dashboards, Quellen und Bedienwege"),
          h("p", null, "Live-Zustand über Rise-L-Loopback · Links ausschließlich Tailnet · dieselbe Jarvis-Lane")
        ),
        h(
          "span",
          { className: "mos__life-count" },
          dashboards.length ? dashboards.filter((item) => item.reachable).length + "/" + dashboards.length + " erreichbar" : "Nicht geprüft"
        )
      ),
      dashboards.length ? h(
        "div",
        { className: "mos__dashboard-grid" },
        dashboards.map((item) => {
          const meta = sourceStateMeta(item.state);
          return h(
            "article",
            { key: item.id, className: "mos__dashboard-card" },
            h(
              "div",
              { className: "mos__dashboard-head" },
              h("span", { className: "mos__dashboard-icon" }, h(Icon, { name: item.icon || "monitor", size: 17 })),
              h("div", null, h("strong", null, item.label), h("small", null, item.purpose)),
              h(
                "span",
                { className: "mos__pip mos__pip--" + meta.tone },
                h("span", { className: "mos__pip-dot", "aria-hidden": "true" }),
                meta.label
              )
            ),
            h(
              "dl",
              { className: "mos__dashboard-meta" },
              h("div", null, h("dt", null, "Wahrheit"), h("dd", null, item.truth)),
              h("div", null, h("dt", null, "Bedienung"), h("dd", null, item.actionMode)),
              h("div", null, h("dt", null, "Nutzer"), h("dd", null, (item.audiences || []).join(" · ")))
            ),
            h(
              "div",
              { className: "mos__dashboard-actions" },
              item.url ? h(
                "button",
                {
                  type: "button",
                  onClick: () => props.onDashboard(item),
                  disabled: !item.reachable
                },
                h(Icon, { name: "external-link", size: 13 }),
                "Öffnen"
              ) : null,
              h(
                "button",
                {
                  type: "button",
                  className: "is-jarvis",
                  onClick: () => props.onJarvis(item.jarvisPrompt)
                },
                h(Icon, { name: "sparkles", size: 13 }),
                "Jarvis steuert"
              )
            )
          );
        })
      ) : h(
        "div",
        { className: "mos__vcd-empty" },
        h(Icon, { name: "monitor", size: 18 }),
        h("span", null, props.load === "loading" ? "Dashboards werden geprüft …" : "Dashboard-Katalog nicht erreichbar."),
        h("small", null, "Keine öffentliche Route wird angelegt.")
      )
    );
  }
  function FutureRadar(props) {
    const radar = props.life && props.life.futureRadar;
    const items = radar && Array.isArray(radar.items) ? radar.items : [];
    return h(
      "section",
      { className: "mos__life-section mos__future", "aria-labelledby": "mos-future-title" },
      h(
        "header",
        { className: "mos__life-heading" },
        h(
          "div",
          null,
          h("span", { className: "mos__life-kicker" }, "Vorausschau"),
          h("h2", { id: "mos-future-title" }, "Zukunftsradar"),
          h("p", null, "Bestätigte Termine und mission.v2-Arbeit — keine erfundenen Prognosen")
        ),
        h("button", {
          type: "button",
          className: "mos__life-jarvis",
          onClick: () => props.onJarvis(
            "Analysiere meinen Zukunftshorizont aus Kalender, Aufgaben, Zielen und Lernquellen. Trenne Fakten, Risiken, Chancen und Vorschläge; erfinde nichts."
          )
        }, h(Icon, { name: "radar", size: 14 }), "Mit Jarvis prüfen")
      ),
      items.length ? h(
        "div",
        { className: "mos__future-strip" },
        items.slice(0, 12).map((item, index) => h(
          "article",
          { key: (item.kind || "item") + "-" + index, className: "mos__future-item" },
          h(
            "span",
            { className: "mos__future-kind" },
            h(Icon, { name: item.kind === "calendar" ? "calendar-days" : "rocket", size: 13 }),
            item.kind === "calendar" ? "Termin" : "Mission"
          ),
          h("strong", null, item.title || "Ohne Titel"),
          h("span", null, item.when || "Kein Zeitpunkt"),
          h("small", null, item.workspace === "company_signal" ? "Firma-Signal · nur lesen" : "Privat")
        ))
      ) : h(
        "div",
        { className: "mos__vcd-empty" },
        h(Icon, { name: "radar", size: 18 }),
        h("span", null, "Keine bestätigten Zukunftssignale."),
        h("small", null, "Kalender- und Missionsquellen bleiben maßgeblich.")
      )
    );
  }
  function FullCalendarTasks(props) {
    const bundle = props.life && props.life.calendarAndTasks;
    const calendar = bundle && bundle.calendar;
    const tasks = bundle && bundle.tasks;
    const columns = [
      { id: "calendar", title: "Kalender", icon: "calendar-days", item: calendar },
      { id: "tasks", title: "Aufgaben & Missionen", icon: "list-todo", item: tasks }
    ];
    return h(
      "section",
      { className: "mos__life-section mos__full-planner", "aria-labelledby": "mos-planner-title" },
      h(
        "header",
        { className: "mos__life-heading" },
        h(
          "div",
          null,
          h("span", { className: "mos__life-kicker" }, "Vollständiger Abschluss"),
          h("h2", { id: "mos-planner-title" }, "Kalender & Aufgaben"),
          h("p", null, "Private Termine, Firma-Dispo und Missionen bleiben sichtbar getrennt")
        ),
        h("button", {
          type: "button",
          className: "mos__life-jarvis",
          onClick: () => props.onJarvis(
            "Öffne meine vollständige Kalender- und Aufgabenlage. Trenne private Termine, Firma-Dispo und Missionen. Hilf mir priorisieren und ändere nur über die zuständige Quelle."
          )
        }, h(Icon, { name: "sparkles", size: 14 }), "Planen mit Jarvis")
      ),
      h(
        "div",
        { className: "mos__planner-grid" },
        columns.map((column) => {
          const rows = column.item && Array.isArray(column.item.rows) ? column.item.rows : [];
          const state = sourceStateMeta(column.item && column.item.state);
          return h(
            "article",
            { key: column.id, className: "mos__planner-column" },
            h(
              "div",
              { className: "mos__planner-head" },
              h("span", null, h(Icon, { name: column.icon, size: 16 }), h("strong", null, column.title)),
              h(
                "span",
                { className: "mos__pip mos__pip--" + state.tone },
                h("span", { className: "mos__pip-dot", "aria-hidden": "true" }),
                state.label
              )
            ),
            rows.length ? h(
              "div",
              { className: "mos__planner-list" },
              rows.slice(0, 16).map((row, index) => h(
                "div",
                {
                  key: (row.missionId || row.startsAt || row.title || "row") + "-" + index,
                  className: "mos__planner-row is-" + (row.workspace || "private")
                },
                h("span", { className: "mos__planner-rowicon" }, h(Icon, { name: row.icon || column.icon, size: 14 })),
                h(
                  "div",
                  null,
                  h("strong", null, row.title || "Ohne Titel"),
                  h("small", null, row.sub || row.owner || (column.id === "calendar" ? "Privat" : "Mission"))
                ),
                h("span", { className: "mos__planner-value" }, row.value || row.statusLabel || "—")
              ))
            ) : h(
              "div",
              { className: "mos__vcd-empty" },
              h("span", null, "Keine bestätigten Einträge."),
              h("small", null, column.item && column.item.note ? column.item.note : "Quelle nicht verfügbar.")
            )
          );
        })
      )
    );
  }
  function VoiceCommandDeck(props) {
    const [voiceStatus, setVoiceStatus] = useState(null);
    return h(
      "div",
      { className: "mos__vcd" },
      h(
        "div",
        { className: "mos__vcd-above" },
        h(
          "div",
          { className: "mos__vcd-main" },
          h(RealtimeVoiceDeck, {
            command: props.command,
            onCommand: props.onCommand,
            onTextFallback: props.onTextFallback,
            onStatus: setVoiceStatus
          }),
          h(SurfaceCatalog, {
            byId: props.byId,
            firma: props.firma,
            komm: props.komm,
            sessions: props.sessions,
            betrieb: props.betrieb,
            onOpen: props.onOpen,
            onComputerUse: props.onComputerUse
          })
        ),
        h(
          "aside",
          { className: "mos__vcd-side" },
          h(ActiveMissionsPanel, {
            sessions: props.sessions,
            load: props.sessionsLoad,
            onOpen: () => props.onOpen("sessions")
          }),
          h(MissionEvidencePanel, {
            sessions: props.sessions,
            load: props.sessionsLoad,
            onOpen: () => props.onOpen("sessions")
          }),
          h(CalendarTasksPanel, { byId: props.byId, onOpen: () => props.onOpen("timeline") }),
          h(ApprovalGatePanel, {
            approvals: props.cockpit.approvals,
            onOpen: () => props.onOpen("approvals")
          }),
          h(SystemHealthPanel, {
            betrieb: props.betrieb,
            voice: voiceStatus,
            loadState: props.load,
            onOpen: () => props.onOpen("betrieb")
          })
        )
      ),
      h(LifeAtlas, {
        life: props.life,
        load: props.lifeLoad,
        onOpen: props.onOpen,
        onJarvis: props.onJarvis
      }),
      h(DashboardObservatory, {
        life: props.life,
        load: props.lifeLoad,
        onDashboard: props.onDashboard,
        onJarvis: props.onJarvis
      }),
      h(FutureRadar, { life: props.life, onJarvis: props.onJarvis }),
      h(FullCalendarTasks, { life: props.life, onJarvis: props.onJarvis })
    );
  }
  function CockpitScene(props) {
    return h(VoiceCommandDeck, props);
  }
  function useIdleTimer(active, ms, onIdle) {
    const cb = useRef(onIdle);
    cb.current = onIdle;
    useEffect(() => {
      if (!active || prefersReducedMotion() || typeof window === "undefined") return;
      let t = null;
      const reset = () => {
        if (t) window.clearTimeout(t);
        t = window.setTimeout(() => {
          if (cb.current) cb.current();
        }, ms);
      };
      const evs = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"];
      evs.forEach((e) => window.addEventListener(e, reset, { passive: true }));
      reset();
      return () => {
        if (t) window.clearTimeout(t);
        evs.forEach((e) => window.removeEventListener(e, reset));
      };
    }, [active, ms]);
  }
  function MikaelOS() {
    const [workspace, setWorkspace] = useState("private");
    const [modules, setModules] = useState(MODULES);
    const [focusId, setFocusId] = useState("engineering");
    const [stateIndex, setStateIndex] = useState(0);
    const [command, setCommand] = useState("");
    const [scene, setScene] = useState("cockpit");
    const isMobile = useMediaQuery("(max-width: 430px)");
    const [mobileTab, setMobileTab] = useState("home");
    const [mobileScreen, setMobileScreen] = useState(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetDetent, setSheetDetent] = useState(1);
    const [live, setLive] = useState(null);
    const [loadState, setLoadState] = useState("loading");
    const [cockpit, setCockpit] = useState({ kpi: null, jarvis: null, approvals: null });
    const [cockpitLoad, setCockpitLoad] = useState("loading");
    const [firma, setFirma] = useState(null);
    const [firmaLoad, setFirmaLoad] = useState("loading");
    const [approvalDetails, setApprovalDetails] = useState({});
    const [approvalDetailLoading, setApprovalDetailLoading] = useState({});
    const [wissenQuery, setWissenQuery] = useState("");
    const [wissen, setWissen] = useState(null);
    const [wissenLoad, setWissenLoad] = useState("idle");
    const [komm, setKomm] = useState(null);
    const [kommLoad, setKommLoad] = useState("loading");
    const [sessions, setSessions] = useState(null);
    const [sessionsLoad, setSessionsLoad] = useState("loading");
    const [ziele, setZiele] = useState(null);
    const [zieleLoad, setZieleLoad] = useState("loading");
    const [reflexion, setReflexion] = useState(null);
    const [reflexionLoad, setReflexionLoad] = useState("loading");
    const [gesundheit, setGesundheit] = useState(null);
    const [gesundheitLoad, setGesundheitLoad] = useState("loading");
    const [betrieb, setBetrieb] = useState(null);
    const [betriebLoad, setBetriebLoad] = useState("loading");
    const [life, setLife] = useState(null);
    const [lifeLoad, setLifeLoad] = useState("loading");
    const [displayEnv, setDisplayEnv] = useState(() => detectDisplayEnv());
    const [pwaStatus, setPwaStatus] = useState({ manifest: false, sw: "unknown" });
    const [approvalsFlash, setApprovalsFlash] = useState(false);
    useRef(null);
    const [propose, setPropose] = useState(null);
    const [review, setReview] = useState(null);
    const [coach, setCoach] = useState(null);
    useEffect(() => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      if (params.get("voice") !== "1") return;
      params.delete("voice");
      const query = params.toString();
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + (query ? "?" + query : "") + window.location.hash
      );
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent(VOICE_OPEN_EVENT));
      });
    }, []);
    const loadOverview = useCallback(() => {
      setLoadState((p) => p === "ready" ? "ready" : "loading");
      sdkGet(PLUGIN_API + "/overview").then((data) => {
        setLive(data);
        setLoadState("ready");
      }).catch(() => {
        setLoadState((p) => p === "ready" ? "ready" : "offline");
      });
    }, []);
    const loadCockpit = useCallback(() => {
      setCockpitLoad((p) => p === "ready" ? "ready" : "loading");
      Promise.allSettled([sdkGet(KPI_API), sdkGet(JARVIS_STATE_API), sdkGet(APPROVALS_API)]).then(([k, j, a]) => {
        setCockpit({
          kpi: k.status === "fulfilled" ? k.value : null,
          jarvis: j.status === "fulfilled" ? j.value : null,
          approvals: a.status === "fulfilled" ? a.value : null
        });
        setCockpitLoad([k, j, a].some((r) => r.status === "fulfilled") ? "ready" : "offline");
      });
    }, []);
    const loadFirma = useCallback(() => {
      setFirmaLoad((p) => p === "ready" ? "ready" : "loading");
      sdkGet(FIRMA_OVERVIEW_API).then((data) => {
        setFirma(data);
        setFirmaLoad("ready");
      }).catch(() => {
        setFirmaLoad((p) => p === "ready" ? "ready" : "offline");
      });
    }, []);
    const loadApprovalDetail = useCallback((id) => {
      if (!id) return;
      setApprovalDetails((prev) => {
        if (prev[id]) return prev;
        setApprovalDetailLoading((l) => ({ ...l, [id]: true }));
        sdkGet(FIRMA_APPROVAL_DETAIL_API + "?id=" + encodeURIComponent(id)).then((data) => {
          setApprovalDetails((p) => ({ ...p, [id]: data }));
          setApprovalDetailLoading((l) => ({ ...l, [id]: false }));
        }).catch(() => {
          setApprovalDetails((p) => ({ ...p, [id]: { ok: false, found: false, note: "Detail nicht erreichbar." } }));
          setApprovalDetailLoading((l) => ({ ...l, [id]: false }));
        });
        return prev;
      });
    }, []);
    const loadWissen = useCallback((term) => {
      const q = (term || "").trim();
      if (q.length < 2) return;
      setWissenLoad("loading");
      sdkGet(WISSEN_SEARCH_API + "?q=" + encodeURIComponent(q)).then((data) => {
        setWissen(data);
        setWissenLoad("ready");
      }).catch(() => {
        setWissen(null);
        setWissenLoad("offline");
      });
    }, []);
    const loadKomm = useCallback(() => {
      setKommLoad((p) => p === "ready" ? "ready" : "loading");
      sdkGet(KOMM_OVERVIEW_API).then((data) => {
        setKomm(data);
        setKommLoad("ready");
      }).catch(() => {
        setKommLoad((p) => p === "ready" ? "ready" : "offline");
      });
    }, []);
    const loadSessions = useCallback(() => {
      setSessionsLoad((p) => p === "ready" ? "ready" : "loading");
      sdkGet(SESSIONS_OVERVIEW_API).then((data) => {
        setSessions(data);
        setSessionsLoad("ready");
      }).catch(() => {
        setSessionsLoad((p) => p === "ready" ? "ready" : "offline");
      });
    }, []);
    const loadZiele = useCallback(() => {
      setZieleLoad((p) => p === "ready" ? "ready" : "loading");
      sdkGet(ZIELE_OVERVIEW_API).then((data) => {
        setZiele(data);
        setZieleLoad("ready");
      }).catch(() => {
        setZieleLoad((p) => p === "ready" ? "ready" : "offline");
      });
    }, []);
    const loadReflexion = useCallback(() => {
      setReflexionLoad((p) => p === "ready" ? "ready" : "loading");
      sdkGet(REFLEXION_OVERVIEW_API).then((data) => {
        setReflexion(data);
        setReflexionLoad("ready");
      }).catch(() => {
        setReflexionLoad((p) => p === "ready" ? "ready" : "offline");
      });
    }, []);
    const loadGesundheit = useCallback(() => {
      setGesundheitLoad((p) => p === "ready" ? "ready" : "loading");
      sdkGet(GESUNDHEIT_OVERVIEW_API).then((data) => {
        setGesundheit(data);
        setGesundheitLoad("ready");
      }).catch(() => {
        setGesundheitLoad((p) => p === "ready" ? "ready" : "offline");
      });
    }, []);
    const loadBetrieb = useCallback(() => {
      setDisplayEnv(detectDisplayEnv());
      setBetriebLoad((p) => p === "ready" ? "ready" : "loading");
      sdkGet(BETRIEB_OVERVIEW_API).then((data) => {
        setBetrieb(data);
        setBetriebLoad("ready");
      }).catch(() => {
        setBetriebLoad((p) => p === "ready" ? "ready" : "offline");
      });
    }, []);
    const loadLife = useCallback(() => {
      setLifeLoad((p) => p === "ready" ? "ready" : "loading");
      sdkGet(LIFE_OVERVIEW_API).then((data) => {
        setLife(data);
        setLifeLoad("ready");
      }).catch(() => {
        setLifeLoad((p) => p === "ready" ? "ready" : "offline");
      });
    }, []);
    useEffect(
      () => {
        loadOverview();
        loadCockpit();
        loadFirma();
        loadKomm();
        loadSessions();
        loadZiele();
        loadReflexion();
        loadGesundheit();
        loadBetrieb();
        loadLife();
      },
      [loadOverview, loadCockpit, loadFirma, loadKomm, loadSessions, loadZiele, loadReflexion, loadGesundheit, loadBetrieb, loadLife]
    );
    useEffect(() => {
      if (typeof window === "undefined") return;
      const reload = () => {
        loadOverview();
        loadCockpit();
        loadFirma();
        loadKomm();
        loadSessions();
        loadZiele();
        loadReflexion();
        loadGesundheit();
        loadBetrieb();
        loadLife();
      };
      const onVisible = () => {
        if (document.visibilityState === "visible") reload();
      };
      const onEnv = () => setDisplayEnv(detectDisplayEnv());
      window.addEventListener("online", reload);
      window.addEventListener("online", onEnv);
      window.addEventListener("offline", onEnv);
      window.addEventListener("focus", reload);
      document.addEventListener("visibilitychange", onVisible);
      return () => {
        window.removeEventListener("online", reload);
        window.removeEventListener("online", onEnv);
        window.removeEventListener("offline", onEnv);
        window.removeEventListener("focus", reload);
        document.removeEventListener("visibilitychange", onVisible);
      };
    }, [loadOverview, loadCockpit, loadFirma, loadKomm, loadSessions, loadZiele, loadReflexion, loadGesundheit, loadBetrieb, loadLife]);
    useEffect(() => {
      const visible = scene === "sessions" || isMobile && mobileScreen === "sessions";
      if (!visible || typeof window === "undefined") return void 0;
      loadSessions();
      const timer = window.setInterval(loadSessions, 4e3);
      return () => window.clearInterval(timer);
    }, [scene, isMobile, mobileScreen, loadSessions]);
    useEffect(() => {
      if (typeof document === "undefined") return void 0;
      let linkEl = null;
      try {
        if (!document.querySelector('link[rel="manifest"][data-mos="1"]')) {
          linkEl = document.createElement("link");
          linkEl.rel = "manifest";
          linkEl.href = PWA_MANIFEST_HREF;
          linkEl.setAttribute("data-mos", "1");
          document.head.appendChild(linkEl);
        } else {
          linkEl = document.querySelector('link[rel="manifest"][data-mos="1"]');
        }
        setPwaStatus((s) => ({ ...s, manifest: true }));
      } catch (_e) {
        setPwaStatus((s) => ({ ...s, manifest: false }));
      }
      if (typeof navigator !== "undefined" && navigator.serviceWorker && window.isSecureContext) {
        navigator.serviceWorker.register(PWA_SW_HREF, { scope: "/mikael-os" }).then(() => setPwaStatus((s) => ({ ...s, sw: "registered" }))).catch(() => setPwaStatus((s) => ({ ...s, sw: "unavailable" })));
      } else {
        setPwaStatus((s) => ({ ...s, sw: "unsupported" }));
      }
      return void 0;
    }, []);
    const liveById = useMemo(() => indexLive(live), [live]);
    const loadingModules = loadState === "loading";
    const viewModules = useMemo(
      () => modules.map((base) => enrichModule(base, liveById[base.id], loadingModules)),
      [modules, liveById, loadingModules]
    );
    const liveCount = useMemo(
      () => viewModules.filter((m) => !m._demo && (m._state === "fresh" || m._state === "stale" || m._state === "partial")).length,
      [viewModules]
    );
    useMemo(() => {
      const hr = (/* @__PURE__ */ new Date()).getHours();
      if (hr < 5) return "Gute Nacht";
      if (hr < 11) return "Guten Morgen";
      if (hr < 17) return "Guten Tag";
      if (hr < 22) return "Guten Abend";
      return "Gute Nacht";
    }, []);
    const announce = useMemo(() => {
      const load = loadState === "loading" ? "Read-Modelle werden geladen." : loadState === "offline" ? "Quellen offline, Konzeptdaten." : liveCount > 0 ? liveCount + " Module live." : "Konzeptdaten.";
      return "Jarvis: " + jarvisStateText(stateIndex) + ". " + load;
    }, [stateIndex, loadState, liveCount]);
    useCallback(() => {
      setMobileTab("jarvis");
    }, []);
    const enrichedById = useMemo(() => {
      const map = {};
      viewModules.forEach((m) => {
        map[m.id] = m;
      });
      Object.keys(liveById).forEach((id) => {
        if (map[id]) return;
        const L = liveById[id];
        map[id] = enrichModule(
          { id, title: L.title, icon: L.icon, accent: L.accent, pos: { x: 50, y: 50 } },
          L,
          loadingModules
        );
      });
      return map;
    }, [viewModules, liveById, loadingModules]);
    const stageRef = useRef(null);
    const inputRef = useRef(null);
    const dragRef = useRef(null);
    const timersRef = useRef([]);
    const [dragId, setDragId] = useState(null);
    const modulesRef = useRef(modules);
    modulesRef.current = modules;
    const focusIdRef = useRef(focusId);
    focusIdRef.current = focusId;
    const sheetOpenRef = useRef(sheetOpen);
    sheetOpenRef.current = sheetOpen;
    const isMobileRef = useRef(isMobile);
    isMobileRef.current = isMobile;
    const reviewOpenRef = useRef(false);
    reviewOpenRef.current = !!review;
    const coachOpenRef = useRef(false);
    coachOpenRef.current = !!coach;
    const proposeRef = useRef(null);
    proposeRef.current = propose;
    const clearTimers = useCallback(() => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    }, []);
    const runStateSequence = useCallback(() => {
      clearTimers();
      if (prefersReducedMotion()) {
        setStateIndex(STATES.length - 1);
        return;
      }
      const steps = [1, 2, 3, 4, 5, 6];
      steps.forEach((s, i) => {
        timersRef.current.push(window.setTimeout(() => setStateIndex(s), (i + 1) * 750));
      });
      timersRef.current.push(window.setTimeout(() => setStateIndex(0), (steps.length + 2) * 750));
    }, [clearTimers]);
    const activate = useCallback((id) => {
      setFocusId(id);
      setStateIndex(1);
    }, []);
    const closeFocus = useCallback(() => {
      setFocusId("engineering");
      setStateIndex(0);
    }, []);
    const openModule = useCallback((id) => {
      setFocusId(id);
      setStateIndex(1);
      setSheetDetent(1);
      setSheetOpen(true);
    }, []);
    useCallback(() => {
      setSheetOpen(false);
    }, []);
    const onSpeak = useCallback(() => {
      setScene("cockpit");
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent(VOICE_OPEN_EVENT));
      });
    }, []);
    useCallback((label) => {
      setCommand(label);
      runStateSequence();
    }, [runStateSequence]);
    const proposeOpen = useCallback((objective, profile) => {
      const obj = (objective || "").trim();
      const prof = profile || "engineering";
      const api = (PROPOSE_PROFILES[prof] || PROPOSE_PROFILES.engineering).api;
      if (!obj) {
        setPropose({ phase: "compose", objective: "", profile: prof });
        return;
      }
      setPropose({ phase: "loading", objective: obj, profile: prof });
      sdkPost(api, { objective: obj, dryRun: true }).then((r) => {
        if (!r || r.ok === false) {
          setPropose({
            phase: "compose",
            objective: obj,
            profile: prof,
            error: r && r.note || "Vorschau nicht möglich."
          });
          return;
        }
        setPropose({
          phase: "preview",
          objective: r.plan.objective,
          preview: r,
          profile: prof,
          gate: r.predictedGate,
          controlPlane: r.controlPlane,
          note: null
        });
      }).catch(() => setPropose({ phase: "compose", objective: obj, profile: prof, error: "Vorschau nicht erreichbar." }));
    }, []);
    const proposeObjective = useCallback((v) => {
      setPropose((prev) => prev ? { ...prev, objective: v, error: null } : prev);
    }, []);
    const proposePreview = useCallback((objective, back) => {
      const prof = proposeRef.current && proposeRef.current.profile || "engineering";
      if (back) {
        setPropose({ phase: "compose", objective: proposeRef.current && proposeRef.current.objective || "", profile: prof });
        return;
      }
      proposeOpen(objective, prof);
    }, [proposeOpen]);
    const proposeSend = useCallback((objective) => {
      const obj = (objective || "").trim();
      if (!obj) return;
      const prof = proposeRef.current && proposeRef.current.profile || "engineering";
      const api = (PROPOSE_PROFILES[prof] || PROPOSE_PROFILES.engineering).api;
      setPropose((prev) => ({ ...prev || {}, phase: "submitting", objective: obj }));
      sdkPost(api, { objective: obj, dryRun: false }).then((r) => {
        if (!r || r.ok === false && r.status !== "auth_pending") {
          setPropose((prev) => ({
            ...prev || {},
            phase: "error",
            objective: obj,
            note: r && r.note || "An das Gate senden fehlgeschlagen."
          }));
          return;
        }
        const lifecycle = r.lifecycle || (r.status === "auth_pending" ? "auth_pending" : "waiting_approval");
        setPropose((prev) => ({
          ...prev || {},
          phase: lifecycle,
          objective: obj,
          cardId: r.cardId,
          controlPlane: r.controlPlane,
          gate: r.gate,
          note: r.note
        }));
      }).catch(() => setPropose((prev) => ({
        ...prev || {},
        phase: "error",
        objective: obj,
        note: "Control-Plane nicht erreichbar."
      })));
    }, []);
    const proposePoll = useCallback((stt) => {
      const s = stt || {};
      const q = s.cardId ? "cardId=" + encodeURIComponent(s.cardId) : "objective=" + encodeURIComponent(s.objective || "");
      sdkGet(RECEIPT_API + "?" + q).then((r) => {
        if (!r) return;
        const lifecycle = r.lifecycle || "waiting_approval";
        setPropose((prev) => ({
          ...prev || {},
          phase: lifecycle,
          cardId: r.cardId || prev && prev.cardId,
          note: r.note
        }));
      }).catch(() => {
      });
    }, []);
    const proposeClose = useCallback(() => {
      setPropose(null);
    }, []);
    const reviewOpen = useCallback(() => {
      setReview({ phase: "loading", data: null, index: 0, flipped: false, reviewed: 0 });
      sdkGet(REVIEW_API + "?limit=20").then((d) => {
        const cards = d && Array.isArray(d.cards) ? d.cards : [];
        let phase;
        if (!d) phase = "error";
        else if (cards.length) phase = "ready";
        else if (d.state === "unavailable" || d.state === "error") phase = "unavailable";
        else phase = "empty";
        setReview({ phase, data: d || null, index: 0, flipped: false, reviewed: 0 });
      }).catch(() => setReview({ phase: "error", data: null, index: 0, flipped: false, reviewed: 0 }));
    }, []);
    const reviewFlip = useCallback(() => {
      setReview((p) => p && p.phase === "ready" && !p.flipped ? { ...p, flipped: true } : p);
    }, []);
    const reviewRate = useCallback(() => {
      setReview((p) => {
        if (!p || p.phase !== "ready" || !p.flipped) return p;
        const cards = p.data && p.data.cards || [];
        const nextIdx = p.index + 1;
        const reviewed = p.reviewed + 1;
        if (nextIdx >= cards.length) return { ...p, phase: "done", reviewed };
        return { ...p, index: nextIdx, flipped: false, reviewed };
      });
    }, []);
    const reviewRestart = useCallback(() => {
      setReview((p) => {
        if (!p) return p;
        const hasCards = p.data && Array.isArray(p.data.cards) && p.data.cards.length;
        return { ...p, phase: hasCards ? "ready" : p.phase, index: 0, flipped: false, reviewed: 0 };
      });
    }, []);
    const reviewClose = useCallback(() => {
      setReview(null);
    }, []);
    const coachLoadFeynman = useCallback((concept) => {
      const q = concept ? "?concept=" + encodeURIComponent(concept) : "";
      setCoach((p) => p ? { ...p, fey: { ...p.fey || {}, phase: "loading" } } : p);
      sdkGet(FEYNMAN_API + q).then((d) => setCoach((p) => p ? { ...p, fey: { phase: "ready", setup: d || {}, explanation: "", result: null } } : p)).catch(() => setCoach((p) => p ? { ...p, fey: { phase: "ready", setup: {}, explanation: "", result: null } } : p));
    }, []);
    const coachOpen = useCallback(() => {
      setCoach({
        tab: "countdown",
        planState: "loading",
        plan: null,
        fey: { phase: "loading", setup: {}, explanation: "", result: null }
      });
      sdkGet(STUDY_PLAN_API).then((d) => setCoach((p) => p ? { ...p, planState: d ? "ready" : "error", plan: d || null } : p)).catch(() => setCoach((p) => p ? { ...p, planState: "error" } : p));
      coachLoadFeynman("");
    }, [coachLoadFeynman]);
    const coachTab = useCallback((t) => {
      setCoach((p) => p ? { ...p, tab: t } : p);
    }, []);
    const coachExplain = useCallback((v) => {
      setCoach((p) => p ? { ...p, fey: { ...p.fey || {}, explanation: v } } : p);
    }, []);
    const coachNextConcept = useCallback(() => {
      coachLoadFeynman("");
    }, [coachLoadFeynman]);
    const coachEvaluate = useCallback(() => {
      const cur = coach && coach.fey;
      const expl = (cur && cur.explanation || "").trim();
      if (!expl) return;
      const concept = cur && cur.setup && cur.setup.concept || "";
      setCoach((p) => p ? { ...p, fey: { ...p.fey || {}, phase: "evaluating" } } : p);
      sdkPost(FEYNMAN_EVAL_API, { concept, explanation: expl }).then((r) => setCoach((p) => p ? { ...p, fey: { ...p.fey || {}, phase: "done", result: r || { ok: false, note: "Keine Antwort." } } } : p)).catch(() => setCoach((p) => p ? { ...p, fey: { ...p.fey || {}, phase: "done", result: { ok: false, note: "Jarvis nicht erreichbar — nichts bewertet, nichts gespeichert.", jarvisDependent: true } } } : p));
    }, [coach]);
    const coachClose = useCallback(() => {
      setCoach(null);
    }, []);
    const coachPropose = useCallback((objective, profile) => {
      setCoach(null);
      proposeOpen(objective, profile);
    }, [proposeOpen]);
    const onNodePointerDown = useCallback((e, id) => {
      if (e.button != null && e.button !== 0) return;
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      dragRef.current = { id, startX: e.clientX, startY: e.clientY, rect, moved: false };
      try {
        e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_e) {
      }
    }, []);
    useEffect(() => {
      let rafId = 0;
      let pending = null;
      const commit = () => {
        rafId = 0;
        if (!pending) return;
        const p = pending;
        pending = null;
        setModules((prev) => prev.map((m) => m.id === p.id ? { ...m, pos: { x: p.x, y: p.y } } : m));
      };
      function onMove(e) {
        const d = dragRef.current;
        if (!d) return;
        const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
        if (!d.moved && Math.hypot(dx, dy) < 5) return;
        if (!d.moved) {
          d.moved = true;
          setDragId(d.id);
        }
        const nx = Math.max(4, Math.min(96, (e.clientX - d.rect.left) / d.rect.width * 100));
        const ny = Math.max(4, Math.min(96, (e.clientY - d.rect.top) / d.rect.height * 100));
        pending = { id: d.id, x: nx, y: ny };
        if (!rafId) rafId = window.requestAnimationFrame(commit);
      }
      function onUp() {
        const d = dragRef.current;
        dragRef.current = null;
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
        if (pending) {
          commit();
        }
        if (d && d.moved) {
          setDragId(null);
        }
      }
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (rafId) window.cancelAnimationFrame(rafId);
      };
    }, []);
    useEffect(() => {
      function onKey(e) {
        const k = e.key;
        if (reviewOpenRef.current || coachOpenRef.current) return;
        if ((e.metaKey || e.ctrlKey) && (k === "k" || k === "K")) {
          e.preventDefault();
          if (inputRef.current) inputRef.current.focus();
          return;
        }
        const tag = e.target && e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") {
          if (k === "Escape" && inputRef.current) inputRef.current.blur();
          return;
        }
        const mods = modulesRef.current;
        if (k === "Escape") {
          if (sheetOpenRef.current) {
            setSheetOpen(false);
          } else {
            closeFocus();
          }
          return;
        }
        if (k >= "1" && k <= "9") {
          const idx = parseInt(k, 10) - 1;
          if (mods[idx]) {
            if (isMobileRef.current) openModule(mods[idx].id);
            else activate(mods[idx].id);
          }
          return;
        }
        if (k === "ArrowRight" || k === "ArrowLeft") {
          const ids = mods.map((m) => m.id);
          const cur = ids.indexOf(focusIdRef.current);
          const next = cur === -1 ? k === "ArrowRight" ? 0 : ids.length - 1 : (cur + (k === "ArrowRight" ? 1 : -1) + ids.length) % ids.length;
          activate(ids[next]);
        }
      }
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [activate, closeFocus, openModule]);
    useEffect(() => {
      if (prefersReducedMotion()) return;
      const root = stageRef.current && stageRef.current.closest(".mos");
      if (!root) return;
      function onMove(e) {
        const px = e.clientX / window.innerWidth - 0.5;
        const py = e.clientY / window.innerHeight - 0.5;
        root.style.setProperty("--mos-par-x", (px * -14).toFixed(2) + "px");
        root.style.setProperty("--mos-par-y", (py * -10).toFixed(2) + "px");
      }
      window.addEventListener("pointermove", onMove);
      return () => window.removeEventListener("pointermove", onMove);
    }, []);
    useEffect(() => () => clearTimers(), [clearTimers]);
    const submit = useCallback((e) => {
      if (e && e.preventDefault) e.preventDefault();
      const objective = command.trim();
      if (!objective) return;
      openJarvisChat(objective);
      setCommand("");
    }, [command]);
    useIdleTimer(
      scene === "cockpit" && stateIndex === 0 && !isMobile,
      9e4,
      useCallback(() => setScene("constellation"), [])
    );
    useCallback(() => setScene("approvals"), []);
    useCallback(() => setScene("firma"), []);
    useCallback(() => setScene("approvals"), []);
    const onSceneBack = useCallback(() => setScene("cockpit"), []);
    useCallback((label) => {
      setCommand(label);
      if (inputRef.current) inputRef.current.focus();
    }, []);
    useCallback(() => setScene("timeline"), []);
    useCallback(() => {
      if (isMobile) setMobileTab("timeline");
      else setScene("timeline");
    }, [isMobile]);
    useCallback(() => {
      setScene("approvals");
    }, []);
    useCallback(() => {
      setScene("firma");
    }, []);
    useCallback(() => {
      setScene("cockpit");
    }, []);
    useCallback((id) => {
      setScene(id);
    }, []);
    const onWissenQuery = useCallback((v) => {
      setWissenQuery(v);
    }, []);
    const onComputerUse = useCallback((entry) => {
      const label = entry && entry.label ? entry.label : "Surface";
      setCommand(label + " per Computer Use öffnen — Status und Evidenz sichtbar halten");
      setScene("betrieb");
    }, []);
    const onJarvisAction = useCallback((objective) => {
      openJarvisChat(objective);
    }, []);
    const onDashboard = useCallback((entry) => {
      if (!entry || !entry.url || typeof window === "undefined") return;
      try {
        const target = new URL(entry.url);
        if (target.protocol !== "https:" || !target.hostname.endsWith(".tailbc3df5.ts.net")) return;
        window.location.assign(target.toString());
      } catch (_e) {
      }
    }, []);
    const commandForm = h(
      "form",
      { className: "mos__command", onSubmit: submit },
      h(
        "div",
        { className: "mos__command-bar" },
        h("button", {
          type: "button",
          className: "mos__mic",
          "aria-label": "Jarvis Realtime-Sprachchat starten",
          onClick: onSpeak
        }, h(Icon, { name: "mic", size: 22 })),
        h("input", {
          ref: inputRef,
          className: "mos__command-input",
          type: "text",
          "aria-label": "Befehl eingeben",
          placeholder: "Sage „Jarvis“ oder schreibe einen Befehl …",
          value: command,
          onChange: (e) => setCommand(e.target.value)
        }),
        h("button", { type: "submit", className: "mos__send", "aria-label": "Senden" }, h(Icon, { name: "send-horizontal", size: 18 }))
      ),
      h(
        "div",
        { className: "mos__chips" },
        h("button", {
          key: "propose",
          type: "button",
          className: "mos__chip mos__chip--propose",
          onClick: () => proposeOpen(command),
          title: "Baut eine Dry-Run-Vorschau — sendet nichts, bis du klickst."
        }, h(Icon, { name: "git-branch", size: 14 }), "Codex-Aufgabe vorschlagen"),
        CHIPS.map((c) => h(
          "button",
          { key: c.label, type: "button", className: "mos__chip", onClick: () => {
            setCommand(c.label);
            if (inputRef.current) inputRef.current.focus();
          } },
          h(Icon, { name: c.icon, size: 14 }),
          c.label
        ))
      )
    );
    const constFooter = h(
      "footer",
      { className: "mos__footer" },
      h(
        "button",
        { type: "button", className: "mos__quick", title: NOT_WIRED },
        h(Icon, { name: "layout-grid", size: 16 }),
        "Schnellzugriffe",
        h(Icon, { name: "chevron-up", size: 14 })
      ),
      h(StateRail, { activeIndex: stateIndex }),
      h(
        "span",
        { className: "mos__reorder" },
        h(Icon, { name: "grip-vertical", size: 14 }),
        "Ziehen um neu zu ordnen",
        h("span", { className: "mos__kbd" }, h(Icon, { name: "command", size: 12 }), "K · Kurzbefehle")
      )
    );
    const isBackScene = scene === "firma" || scene === "approvals" || scene === "wissen" || scene === "kommunikation" || scene === "sessions" || scene === "ziele" || scene === "reflexion" || scene === "gesundheit" || scene === "betrieb";
    return h(
      "div",
      { className: "mos" + (scene === "timeline" ? " mos--timeline" : scene === "cockpit" ? " mos--cockpit" : isBackScene ? " mos--cockpit mos--" + scene : "") },
      h("div", { className: "mos__atmosphere", "aria-hidden": "true" }),
      h("div", { className: "mos__atmosphere-veil", "aria-hidden": "true" }),
      h(LiveAnnouncer, { message: announce }),
      h(
        "main",
        { className: "mos__shell", role: "main" },
        h("h1", { className: "mos__sr-only" }, "MIKAEL OS — Persönliches System"),
        h(TopBar, {
          loadState,
          liveCount,
          total: viewModules.length,
          scene,
          onScene: setScene,
          onBack: isBackScene ? onSceneBack : void 0
        }),
        scene === "cockpit" ? h(
          "div",
          { className: "mos__stagewrap mos__stagewrap--ckpt" },
          h(CockpitScene, {
            byId: enrichedById,
            cockpit,
            cockpitLoad,
            load: loadState,
            command,
            onCommand: setCommand,
            onTextFallback: submit,
            firma,
            firmaLoad,
            komm,
            kommLoad,
            sessions,
            sessionsLoad,
            betrieb,
            betriebLoad,
            life,
            lifeLoad,
            onOpen: setScene,
            onComputerUse,
            onJarvis: onJarvisAction,
            onDashboard
          })
        ) : scene === "firma" ? h(
          "div",
          { className: "mos__stagewrap mos__stagewrap--scene" },
          h(
            "div",
            { className: "mos__scenehead" },
            h(Icon, { name: "server", size: 20 }),
            h(
              "div",
              { className: "mos__scenehead-t" },
              h("h2", null, "Firma / Rise-L"),
              h("span", null, "Read-only Projektion · fsm.db/belege.db mode=ro · Paperless nur lesen · Deep-Links ins FSM")
            ),
            h("span", { className: "mos__scenehead-ro" }, h(Icon, { name: "lock", size: 12 }), "Nur lesen")
          ),
          h(FirmaScene, { firma, load: firmaLoad }),
          h("div", { className: "mos__scene-orb", "aria-hidden": "true" }, h(Orb, { label: false }))
        ) : scene === "approvals" ? h(
          "div",
          { className: "mos__stagewrap mos__stagewrap--scene" },
          h(
            "div",
            { className: "mos__scenehead" },
            h(Icon, { name: "shield-check", size: 20 }),
            h(
              "div",
              { className: "mos__scenehead-t" },
              h("h2", null, "Entscheidungen"),
              h("span", null, "Approval-Cards inkl. Intent-Hash + Effekt-Felder · Entscheidung nur durch dich (Operator)")
            ),
            h("span", { className: "mos__scenehead-ro" }, h(Icon, { name: "lock", size: 12 }), "Operator-only")
          ),
          h(ApprovalsScene, {
            approvals: cockpit.approvals,
            load: cockpitLoad,
            details: approvalDetails,
            detailLoading: approvalDetailLoading,
            onLoadDetail: loadApprovalDetail
          }),
          h("div", { className: "mos__scene-orb", "aria-hidden": "true" }, h(Orb, { label: false }))
        ) : scene === "wissen" ? h(
          "div",
          { className: "mos__stagewrap mos__stagewrap--scene" },
          h(
            "div",
            { className: "mos__scenehead" },
            h(Icon, { name: "search", size: 20 }),
            h(
              "div",
              { className: "mos__scenehead-t" },
              h("h2", null, "Wissen & Suche"),
              h("span", null, "Föderiert über unified-search :18055 · Workspace je Treffer sichtbar · nur lesen")
            ),
            h("span", { className: "mos__scenehead-ro" }, h(Icon, { name: "lock", size: 12 }), "Nur lesen")
          ),
          h(WissenScene, { data: wissen, load: wissenLoad, query: wissenQuery, onQuery: onWissenQuery, onSearch: loadWissen })
        ) : scene === "kommunikation" ? h(
          "div",
          { className: "mos__stagewrap mos__stagewrap--scene" },
          h(
            "div",
            { className: "mos__scenehead" },
            h(Icon, { name: "radio-tower", size: 20 }),
            h(
              "div",
              { className: "mos__scenehead-t" },
              h("h2", null, "Kommunikation"),
              h("span", null, "Telegram · Hermes-Vorschläge · FreeScout — nur Signale, Versand G7-gated")
            ),
            h("span", { className: "mos__scenehead-ro" }, h(Icon, { name: "lock", size: 12 }), "Nur lesen")
          ),
          h(KommunikationScene, { data: komm, load: kommLoad }),
          h("div", { className: "mos__scene-orb", "aria-hidden": "true" }, h(Orb, { label: false }))
        ) : scene === "sessions" ? h(
          "div",
          { className: "mos__stagewrap mos__stagewrap--scene" },
          h(
            "div",
            { className: "mos__scenehead" },
            h(Icon, { name: "waypoints", size: 20 }),
            h(
              "div",
              { className: "mos__scenehead-t" },
              h("h2", null, "Sessions / Agenten"),
              h("span", null, "mission.v2 + Session-Broker + Hermes-0.19-Live-Transkripte · Steuerung über Jarvis")
            ),
            h("span", { className: "mos__scenehead-ro" }, h(Icon, { name: "activity", size: 12 }), "Live beobachten")
          ),
          h(SessionsScene, { data: sessions, load: sessionsLoad }),
          h("div", { className: "mos__scene-orb", "aria-hidden": "true" }, h(Orb, { label: false }))
        ) : scene === "ziele" ? h(
          "div",
          { className: "mos__stagewrap mos__stagewrap--scene" },
          h(
            "div",
            { className: "mos__scenehead" },
            h(Icon, { name: "target", size: 20 }),
            h(
              "div",
              { className: "mos__scenehead-t" },
              h("h2", null, "Ziele & Systeme"),
              h("span", null, "Read-only Projektion · mission.v2 + task_priority_policy.yaml · keine neue Task-DB")
            ),
            h("span", { className: "mos__scenehead-ro" }, h(Icon, { name: "lock", size: 12 }), "Nur lesen")
          ),
          h(ZieleScene, { data: ziele, load: zieleLoad }),
          h("div", { className: "mos__scene-orb", "aria-hidden": "true" }, h(Orb, { label: false }))
        ) : scene === "reflexion" ? h(
          "div",
          { className: "mos__stagewrap mos__stagewrap--scene" },
          h(
            "div",
            { className: "mos__scenehead" },
            h(Icon, { name: "notebook-pen", size: 20 }),
            h(
              "div",
              { className: "mos__scenehead-t" },
              h("h2", null, "Reflexion"),
              h("span", null, "Journal · Entscheidungen · Lernerkenntnisse — strikt privat, nur lesen, kein Versand")
            ),
            h("span", { className: "mos__scenehead-ro" }, h(Icon, { name: "lock", size: 12 }), "Privat · nur lesen")
          ),
          h(ReflexionScene, { data: reflexion, load: reflexionLoad }),
          h("div", { className: "mos__scene-orb", "aria-hidden": "true" }, h(Orb, { label: false }))
        ) : scene === "gesundheit" ? h(
          "div",
          { className: "mos__stagewrap mos__stagewrap--scene" },
          h(
            "div",
            { className: "mos__scenehead" },
            h(Icon, { name: "heart-pulse", size: 20 }),
            h(
              "div",
              { className: "mos__scenehead-t" },
              h("h2", null, "Gesundheit"),
              h("span", null, "WHOOP-Connector :18090 · Recovery/Schlaf/HRV/Strain · privat, nur lesen")
            ),
            h("span", { className: "mos__scenehead-ro" }, h(Icon, { name: "lock", size: 12 }), "Privat · nur lesen")
          ),
          h(GesundheitScene, { data: gesundheit, load: gesundheitLoad }),
          h("div", { className: "mos__scene-orb", "aria-hidden": "true" }, h(Orb, { label: false }))
        ) : scene === "betrieb" ? h(
          "div",
          { className: "mos__stagewrap mos__stagewrap--scene" },
          h(
            "div",
            { className: "mos__scenehead" },
            h(Icon, { name: "monitor", size: 20 }),
            h(
              "div",
              { className: "mos__scenehead-t" },
              h("h2", null, "Betrieb 24/7"),
              h("span", null, "Anzeigemodus (clientseitig) · Mac-Steuerung typisiert + propose-only (kein Shell/exec) · Drei-Frontdoor-Kontext")
            ),
            h("span", { className: "mos__scenehead-ro" }, h(Icon, { name: "lock", size: 12 }), "Nur lesen · propose-only")
          ),
          h(BetriebScene, { data: betrieb, load: betriebLoad, displayEnv, pwaStatus }),
          h("div", { className: "mos__scene-orb", "aria-hidden": "true" }, h(Orb, { label: false }))
        ) : scene === "timeline" ? h(
          "div",
          { className: "mos__stagewrap mos__stagewrap--tl" },
          h(TimelineScene, { byId: enrichedById, focusId, onActivate: activate, onClose: closeFocus })
        ) : h(
          "div",
          { className: "mos__stagewrap" },
          h(WorkspaceSwitcher, { active: workspace, onChange: setWorkspace }),
          h(
            "div",
            { className: "mos__stage", ref: stageRef },
            // spatial depth field — cheap radial light-fields + a few drifting
            // energy motes (transform/opacity only, GPU-friendly, static under
            // reduced motion). Purely decorative, sits behind the connectors.
            h(
              "div",
              { className: "mos__depth", "aria-hidden": "true" },
              h("span", { className: "mos__depth-field mos__depth-field--a" }),
              h("span", { className: "mos__depth-field mos__depth-field--b" }),
              h(
                "span",
                { className: "mos__motes" },
                Array.from({ length: 14 }).map((_, i) => h("span", { key: i, className: "mos__mote mos__mote--" + i % 7 }))
              )
            ),
            h(Connectors, { modules: viewModules, focusId }),
            // orbiting module nodes
            viewModules.map((m) => h(ModuleNode, {
              key: m.id,
              module: m,
              active: focusId === m.id,
              dragging: dragId === m.id,
              onActivate: activate,
              onPointerDown: onNodePointerDown
            })),
            // core: orb + handoff chips
            h(
              "div",
              { className: "mos__core" },
              h("span", { className: "mos__core-aura", "aria-hidden": "true" }),
              h(
                "div",
                { className: "mos__core-row" },
                h(
                  "span",
                  { className: "mos__handoff" },
                  h("span", { className: "mos__handoff-k" }, "Übergabe von"),
                  h(Icon, { name: "orbit", size: 16 }),
                  h("b", null, "Jarvis")
                ),
                h(Orb, { label: true }),
                h(
                  "span",
                  { className: "mos__handoff" },
                  h("span", { className: "mos__handoff-k" }, "Übergabe an"),
                  h(Icon, { name: "git-branch", size: 16 }),
                  h("b", null, "Codex / Claude")
                )
              )
            ),
            // focus lens
            h(
              "div",
              { className: "mos__lens-slot" },
              h(FocusLens, {
                focusId,
                liveModule: enrichedById[focusId],
                onClose: closeFocus,
                onPropose: () => proposeOpen(command),
                onReview: reviewOpen,
                onCoach: coachOpen
              })
            ),
            // add-module affordance (bottom-left of stage)
            h(
              "button",
              { type: "button", className: "mos__addmodule", title: NOT_WIRED },
              h("span", { className: "mos__addmodule-plus" }, h(Icon, { name: "circle-plus", size: 18 })),
              "Modul hinzufügen"
            )
          )
        ),
        // Footer (UI-SPEC §1): in the Cockpit the StateRail sits directly ABOVE the
        // command bar; Konstellation/Timeline keep the command bar → footer order.
        isBackScene ? h(
          "footer",
          { className: "mos__ckpt-foot" },
          h(StateRail, { activeIndex: stateIndex }),
          commandForm
        ) : scene === "cockpit" ? null : h(React.Fragment, null, commandForm, constFooter)
      ),
      h(ProposeFlow, {
        state: propose,
        onObjective: proposeObjective,
        onPreview: proposePreview,
        onSend: proposeSend,
        onPoll: proposePoll,
        onClose: proposeClose
      }),
      h(ReviewSurface, {
        state: review,
        onFlip: reviewFlip,
        onRate: reviewRate,
        onRestart: reviewRestart,
        onClose: reviewClose
      }),
      h(CoachSurface, {
        state: coach,
        onTab: coachTab,
        onExplain: coachExplain,
        onEvaluate: coachEvaluate,
        onNextConcept: coachNextConcept,
        onPropose: coachPropose,
        onClose: coachClose
      })
    );
  }
  if (SDK && React && typeof window !== "undefined" && window.__HERMES_PLUGINS__ && typeof window.__HERMES_PLUGINS__.register === "function") {
    window.__HERMES_PLUGINS__.register("mikael-os", MikaelOS);
  }
  return MikaelOS;
}();
