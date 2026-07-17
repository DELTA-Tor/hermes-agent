var MikaelOSPlugin = function() {
  "use strict";
  const ICONS = {
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
    { id: "tasks", title: "Aufgaben & Ziele", icon: "list-todo", accent: "amber", meta: "7 aktiv · 3 heute", metric: "7", metricSub: "aktiv · 3 heute", pos: { x: 47, y: 9 } },
    { id: "learning", title: "Lernplan", icon: "graduation-cap", accent: "violet", meta: "Anki-Sync bereit", metric: "—", metricSub: "Karten fällig", pos: { x: 67, y: 14 } },
    { id: "risel", title: "Rise-L Prozesse", icon: "server", accent: "blue", meta: "5 Workflows aktiv", metric: "5", metricSub: "Workflows aktiv", pos: { x: 86, y: 22 } },
    { id: "travel", title: "Reisen", icon: "plane", accent: "cyan", meta: "Rom · 18. Jun", metric: "3 T", metricSub: "bis Rom", pos: { x: 89, y: 41 } },
    { id: "nutrition", title: "Ernährung", icon: "leaf", accent: "emerald", meta: "2.105 kcal", metric: "2.105", metricSub: "kcal heute", pos: { x: 89, y: 58 } },
    { id: "company", title: "Firma-Signale", icon: "building-2", accent: "neutral", meta: "Nur lesen", metric: "—", metricSub: "Nur lesen", readOnly: true, pos: { x: 85, y: 75 } },
    { id: "journal", title: "Journal", icon: "notebook-pen", accent: "neutral", meta: "1 Eintrag heute", metric: "1", metricSub: "Eintrag heute", pos: { x: 13, y: 70 } },
    { id: "body", title: "Körper / WHOOP", icon: "heart-pulse", accent: "emerald", meta: "Recovery 82%", metric: "82 %", metricSub: "Recovery", pos: { x: 9, y: 51 } },
    { id: "kalender", title: "Kalender", icon: "calendar-days", accent: "cyan", meta: "Nächster · 10:30", metric: "10:30", metricSub: "nächstes Ereignis", pos: { x: 11, y: 32 } },
    { id: "today", title: "Heute", icon: "sun", accent: "cyan", meta: "9 Ereignisse", metric: "9", metricSub: "Ereignisse", pos: { x: 26, y: 15 } }
  ];
  const TIMELINE = [
    { id: "briefing", period: "morgen", time: "06:45", end: "07:00", title: "Morgenbriefing", sub: "Tagesstart & Fokus setzen", icon: "sun", accent: "cyan", moduleId: "today" },
    { id: "training", period: "morgen", time: "07:30", end: "08:30", title: "Training", sub: "Hyrox + Mobility", icon: "activity", accent: "emerald", moduleId: "body" },
    { id: "deep1", period: "morgen", time: "09:00", end: "11:00", title: "Deep Work Block 1", sub: "Codex Build Sprint", icon: "code-xml", accent: "cyan", moduleId: "engineering" },
    { id: "learn", period: "morgen", time: "11:00", end: "11:45", title: "Lernplan", sub: "KI-Systeme · Kapitel 4", icon: "graduation-cap", accent: "violet", moduleId: "learning" },
    { id: "claude", period: "mittag", time: "11:45", end: "12:30", title: "Claude Mission", sub: "Research & Draft", icon: "sparkles", accent: "violet", moduleId: "engineering" },
    { id: "biz", period: "mittag", time: "13:00", end: "13:45", title: "Business Review", sub: "KPIs & Team-Sync", icon: "building-2", accent: "amber", moduleId: "company" },
    { id: "focus2", period: "mittag", time: "14:30", end: "16:00", title: "Focus Block 2", sub: "Engineering & Delivery", icon: "zap", accent: "cyan", moduleId: "engineering" },
    { id: "riselp", period: "mittag", time: "16:00", end: "16:30", title: "Rise-L Process", sub: "Weekly Verification", icon: "server", accent: "emerald", moduleId: "risel" },
    { id: "route", period: "abend", time: "17:00", end: "18:30", title: "Route & Reisen", sub: "Flughafen ZRH – MUC", icon: "plane", accent: "amber", moduleId: "travel" },
    { id: "dinner", period: "abend", time: "19:00", end: "21:00", title: "Abendessen", sub: "High Protein + Greens", icon: "utensils", accent: "emerald", moduleId: "nutrition" },
    { id: "journalx", period: "abend", time: "21:30", end: "22:00", title: "Journal & Reflexion", sub: "Tagesreview & Dankbarkeit", icon: "notebook-pen", accent: "violet", moduleId: "journal" }
  ];
  const TODAY = { long: "Donnerstag, 26. Juni", short: "Do, 26. Juni" };
  const TIMELINE_NOW = { after: "riselp", time: "16:42", suggestion: "Kurze Pause vor der Fahrt einlegen.", tag: "Hydration" };
  const CORE_POS = { x: 50, y: 33 };
  const PERIODS = [
    { id: "morgen", label: "Morgen", icon: "sun" },
    { id: "mittag", label: "Mittag", icon: "cloud-moon" },
    { id: "abend", label: "Abend", icon: "moon-star" }
  ];
  const LENS = {
    engineering: {
      icon: "code-xml",
      accent: "violet",
      title: "Engineering / Codex",
      sub: "Fokus-Linse · 4 Missionen",
      source: "GitHub",
      freshness: "vor 7 Min",
      permission: "Lesen & Schreiben",
      rows: [
        { icon: "rocket", accent: "emerald", title: "Feature: KI Fokus-Modus", sub: "Sprint 42 · Frontend", status: "running", statusLabel: "Läuft", value: "68 %" },
        { icon: "lock", accent: "amber", title: "API: Permissions Service", sub: "Backend · Sicherheit", status: "waiting", statusLabel: "Wartet auf Review", value: "—" },
        { icon: "circle-check-big", accent: "cyan", title: "Refactor: Workspace Core", sub: "Architektur", status: "verified", statusLabel: "Verifiziert", value: "100 %" },
        { icon: "flask-round", accent: "emerald", title: "Test Suite: E2E Stabilität", sub: "Qualitätssicherung", status: "running", statusLabel: "Läuft", value: "24 %" }
      ]
    },
    today: {
      icon: "sun",
      accent: "cyan",
      title: "Heute",
      sub: "Tagesplan · 9 Ereignisse",
      source: "Kalender",
      freshness: "vor 2 Min",
      permission: "Nur lesen",
      rows: [
        { icon: "sun", accent: "cyan", title: "Morning Light & Bewegung", sub: "20 Min · Tagesstart", value: "07:30" },
        { icon: "brain", accent: "emerald", title: "Strategy Deep Work", sub: "90 Min · Fokus", value: "09:00" },
        { icon: "target", accent: "violet", title: "Leadership Sync", sub: "45 Min · Team", value: "12:30" },
        { icon: "plane", accent: "cyan", title: "Kunden-Call · Projekt A", sub: "60 Min", value: "16:30" }
      ]
    },
    tasks: {
      icon: "target",
      accent: "emerald",
      title: "Aufgaben & Ziele",
      sub: "7 aktiv · 3 heute fällig",
      source: "Personal OS",
      freshness: "vor 5 Min",
      permission: "Lesen & Schreiben",
      rows: [
        { icon: "circle-check-big", accent: "emerald", title: "Strategie Review", sub: "Diese Woche", status: "running", statusLabel: "Läuft", value: "60 %" },
        { icon: "circle-check-big", accent: "amber", title: "Team Alignment", sub: "Diese Woche", status: "waiting", statusLabel: "Wartet", value: "30 %" },
        { icon: "circle-check-big", accent: "violet", title: "Produkt Roadmap", sub: "Nächste Woche", value: "10 %" }
      ]
    },
    learning: {
      icon: "graduation-cap",
      accent: "violet",
      title: "Lernplan",
      sub: "Spaced Repetition · Anki",
      source: "anki-sync (read-only)",
      freshness: "—",
      permission: "Nur lesen (mode=ro)",
      rows: [
        { icon: "graduation-cap", accent: "violet", title: "Fällig heute", sub: "Anki-Karten", value: "—" },
        { icon: "target", accent: "cyan", title: "Retention", sub: "letzte 30 Tage", value: "—" },
        { icon: "flame", accent: "violet", title: "Streak", sub: "Lern-Tage in Folge", value: "—" }
      ]
    },
    risel: {
      icon: "server",
      accent: "amber",
      title: "Rise-L Prozesse",
      sub: "5 Workflows aktiv",
      source: "systemd --user",
      freshness: "07:15",
      permission: "Nur lesen",
      rows: [
        { icon: "server", accent: "emerald", title: "Systeme online", sub: "Alle Kernsysteme stabil", status: "verified", statusLabel: "Verifiziert", value: "OK" },
        { icon: "activity", accent: "amber", title: "Mail-Sync · Dispatch-Pulse", sub: "Letzter Lauf heute", value: "5" },
        { icon: "clock", accent: "cyan", title: "Letzter Check", sub: "Heute", value: "07:15" }
      ]
    },
    travel: {
      icon: "plane",
      accent: "cyan",
      title: "Reisen",
      sub: "Nächste Reise · Rom",
      source: "Reiseplan",
      freshness: "vor 3 Std",
      permission: "Nur lesen",
      rows: [
        { icon: "plane", accent: "cyan", title: "Rom · Städtereise", sub: "Abflug 18. Jun · 08:20", value: "3 T" },
        { icon: "map", accent: "emerald", title: "Hotel bestätigt", sub: "Trastevere", status: "verified", statusLabel: "Verifiziert", value: "OK" },
        { icon: "clock", accent: "amber", title: "Check-in öffnet", sub: "17. Jun", value: "—" }
      ]
    },
    nutrition: {
      icon: "leaf",
      accent: "emerald",
      title: "Ernährung",
      sub: "Heute · 2.105 kcal",
      source: "Ernährungs-Log",
      freshness: "vor 40 Min",
      permission: "Lesen & Schreiben",
      rows: [
        { icon: "utensils", accent: "emerald", title: "Protein", sub: "Ziel 160 g", status: "running", statusLabel: "Läuft", value: "142 g" },
        { icon: "leaf", accent: "cyan", title: "Wasser", sub: "Ziel 3 L", value: "2,1 L" },
        { icon: "activity", accent: "amber", title: "Koffein", sub: "Letzte Tasse 14:00", value: "2×" }
      ]
    },
    company: {
      icon: "building-2",
      accent: "neutral",
      title: "Firma-Signale",
      sub: "Nur lesen · Approval-Cards",
      source: "Delta-Tor",
      freshness: "vor 12 Min",
      permission: "Nur lesen",
      rows: [
        { icon: "activity", accent: "emerald", title: "Team Momentum", sub: "Auslastung stabil", status: "verified", statusLabel: "Stark", value: "" },
        { icon: "message-square", accent: "cyan", title: "Stakeholder Feedback", sub: "360 Feedback", value: "Positiv" },
        { icon: "shield-check", accent: "amber", title: "Risiko Radar", sub: "Keine Eskalation", value: "Niedrig" }
      ]
    },
    kalender: {
      icon: "calendar-days",
      accent: "cyan",
      title: "Kalender / Route",
      sub: "Nächster Termin · 10:30",
      source: "Kalender",
      freshness: "vor 2 Min",
      permission: "Nur lesen",
      rows: [
        { icon: "target", accent: "cyan", title: "Leadership Sync", sub: "Team-Update", value: "10:30" },
        { icon: "brain", accent: "emerald", title: "Strategie Review", sub: "Q2 Planung", value: "14:00" },
        { icon: "plane", accent: "amber", title: "Kunden-Call · Projekt A", sub: "Anfahrt 36 Min · Leichtverkehr", value: "16:30" }
      ]
    },
    body: {
      icon: "heart-pulse",
      accent: "emerald",
      title: "Körper / WHOOP",
      sub: "Recovery 82% · Gut",
      source: "WHOOP",
      freshness: "Stand 06:12",
      permission: "Nur lesen",
      rows: [
        { icon: "heart-pulse", accent: "emerald", title: "Recovery", sub: "Bereit für hohe Belastung", status: "verified", statusLabel: "Gut", value: "82 %" },
        { icon: "moon", accent: "cyan", title: "Schlaf", sub: "Erholsam", value: "7 h 26 m" },
        { icon: "activity", accent: "amber", title: "Ruhepuls · Belastung", sub: "48 bpm · Strain 32", value: "+12 %" }
      ]
    },
    journal: {
      icon: "notebook-pen",
      accent: "cyan",
      title: "Journal",
      sub: "1 Eintrag heute",
      source: "Journal",
      freshness: "vor 6 Std",
      permission: "Lesen & Schreiben",
      rows: [
        { icon: "notebook-pen", accent: "cyan", title: "Wie fühlt sich Fokus heute an?", sub: "Sprach- oder Text-Eintrag", value: "—" },
        { icon: "audio-lines", accent: "violet", title: "Voice-Memo", sub: "Heute 06:40", value: "0:48" }
      ]
    }
  };
  const NOT_WIRED = "Noch nicht verbunden — folgt in Phase 3 (über Gates, propose-only).";
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
  const KPI_API = PLUGIN_API + "/cockpit/kpi";
  const JARVIS_STATE_API = PLUGIN_API + "/cockpit/jarvis-state";
  const APPROVALS_API = PLUGIN_API + "/cockpit/approvals";
  const FIRMA_OVERVIEW_API = PLUGIN_API + "/firma/overview";
  const FIRMA_APPROVAL_DETAIL_API = PLUGIN_API + "/firma/approvals/detail";
  const WISSEN_SEARCH_API = PLUGIN_API + "/wissen/search";
  const KOMM_OVERVIEW_API = PLUGIN_API + "/kommunikation/overview";
  const SESSIONS_OVERVIEW_API = PLUGIN_API + "/agent-sessions/overview";
  const ZIELE_OVERVIEW_API = PLUGIN_API + "/ziele/overview";
  const REFLEXION_OVERVIEW_API = PLUGIN_API + "/reflexion/overview";
  const GESUNDHEIT_OVERVIEW_API = PLUGIN_API + "/gesundheit/overview";
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
  function sdkGet(url) {
    const sdk = typeof window !== "undefined" && window.__HERMES_PLUGIN_SDK__ || {};
    if (typeof sdk.fetchJSON === "function") return Promise.resolve(sdk.fetchJSON(url));
    if (typeof fetch === "function") return fetch(url).then((r) => r.ok ? r.json() : Promise.reject(r.status));
    return Promise.reject(new Error("no transport"));
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
      rows: fixture.rows,
      source: "Konzept",
      freshness: "Konzeptdaten",
      permission: fixture.permission,
      state: L ? "fresh" : "loading",
      demo: true,
      note: L && L._note
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
        LENS_TOOLS.map((tl) => h("button", { key: tl.label, type: "button", className: "mos__tool", title: NOT_WIRED }, h(Icon, { name: tl.icon, size: 15 }), tl.label))
      )
    );
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
          h("span", { className: "mos__tl-card-range" }, e.time + " – " + e.end)
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
  function TimelineNow() {
    return h(
      "div",
      { className: "mos__tl-row mos__tl-row--now" },
      h("span", { className: "mos__tl-time mos__tl-time--now" }, TIMELINE_NOW.time),
      h("span", { className: "mos__tl-now-node", "aria-hidden": "true" }, "J"),
      h(
        "div",
        { className: "mos__tl-now-card" },
        h("span", { className: "mos__tl-now-k" }, h(Icon, { name: "orbit", size: 13 }), "Jarvis · Vorschlag"),
        h(
          "span",
          { className: "mos__tl-now-text" },
          TIMELINE_NOW.suggestion,
          h("span", { className: "mos__tl-now-tag" }, "+" + TIMELINE_NOW.tag)
        ),
        h("span", { className: "mos__pip mos__pip--konzept" }, h(Icon, { name: "flask-conical", size: 11 }), "schreibt nichts")
      )
    );
  }
  function TimelineAxis(props) {
    const rows = [];
    PERIODS.forEach((per) => {
      rows.push(h("div", { key: "p-" + per.id, className: "mos__tl-period" }, h(Icon, { name: per.icon, size: 14 }), per.label));
      TIMELINE.filter((e) => e.period === per.id).forEach((e) => {
        rows.push(
          h(
            "div",
            { key: e.id, className: "mos__tl-row" },
            h("span", { className: "mos__tl-time" }, e.time),
            h("span", { className: "mos__tl-mark", "aria-hidden": "true" }),
            h(TimelineCard, { event: e, module: props.byId[e.moduleId], active: props.activeEventId === e.id, onActivate: props.onActivate })
          )
        );
        if (props.showNow && e.id === TIMELINE_NOW.after) rows.push(h(TimelineNow, { key: "now" }));
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
    const linked = byId[e.moduleId];
    const cal = byId["kalender"];
    const tasks = byId["tasks"];
    const body = byId["body"];
    const liveSignals = Object.keys(byId).map((k) => byId[k]).filter((m) => m && !m._demo && m.title && m.icon && (m._state === "fresh" || m._state === "stale" || m._state === "partial")).sort((a, b) => (a._state === "fresh" ? -1 : 1) - (b._state === "fresh" ? -1 : 1)).slice(0, 4);
    const calRows = (cal && cal._rows && cal._rows.length ? cal._rows : LENS.kalender.rows).slice(0, 3);
    const topRows = (tasks && tasks._rows && tasks._rows.length ? tasks._rows : LENS.tasks.rows).slice(0, 3);
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
        // Jarvis Empfehlung
        h(
          "section",
          { className: "mos__tlfocus-sec mos__tlfocus-rec" },
          h("h3", { className: "mos__tlfocus-h3" }, h(Icon, { name: "orbit", size: 14 }), "Jarvis Empfehlung"),
          h(
            "p",
            { className: "mos__tlfocus-rec-text" },
            "Sehr gute Ausgangslage für Deep Work am Vormittag. Plane Fokusblöcke vor 11:30 und schütze deine Energie. Nachmittags Meetings & Kommunikation."
          ),
          h("span", { className: "mos__pip mos__pip--konzept" }, h(Icon, { name: "flask-conical", size: 11 }), "schreibt nichts")
        ),
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
    const focusEvent = TIMELINE.find((e) => e.moduleId === props.focusId) || TIMELINE.find((e) => e.id === TIMELINE_NOW.after) || TIMELINE[0];
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
            h("span", { className: "mos__tl-head-sub" }, TODAY.long + " · Morgen → Nacht")
          )
        ),
        h("div", { className: "mos__tl-scroll" }, h(TimelineAxis, { byId: props.byId, activeEventId: focusEvent.id, onActivate: props.onActivate, showNow: true }))
      ),
      h(TimelineFocusPanel, { event: focusEvent, byId: props.byId, onClose: props.onClose })
    );
  }
  const M_TABS = [
    { id: "home", icon: "house", label: "Home" },
    { id: "timeline", icon: "list", label: "Timeline" },
    { id: "jarvis", icon: "brain", label: "Jarvis" },
    { id: "module", icon: "layers", label: "Module" },
    { id: "profil", icon: "circle-user", label: "Profil" }
  ];
  function MobileTopBar(props) {
    return h(
      "header",
      { className: "mos__mtop" },
      h(
        "div",
        { className: "mos__mtop-id" },
        h("span", { className: "mos__mtop-avatar", "aria-hidden": "true" }, "M"),
        h("span", { className: "mos__mtop-word" }, "MIKAEL OS")
      ),
      h(
        "div",
        { className: "mos__mtop-right" },
        h(
          "span",
          { className: "mos__mtop-time" },
          h("span", { className: "mos__mtop-city" }, "BERLIN"),
          h("b", null, "09:41")
        ),
        props.loadState === "loading" ? h("span", { className: "mos__concept mos__concept--loading" }, h(Icon, { name: "loader", size: 12 }), "Lädt") : props.liveCount > 0 ? h("span", { className: "mos__concept mos__concept--live" }, h(Icon, { name: "activity", size: 12 }), props.liveCount + " Live") : h("span", { className: "mos__concept" }, h(Icon, { name: "flask-conical", size: 12 }), "Konzept")
      )
    );
  }
  function DomainCardM(props) {
    const m = props.module;
    if (!m) return null;
    return h(
      "button",
      { type: "button", className: "mos__mcard mos--" + m.accent, onClick: () => props.onOpen(m.id), "aria-label": m.title + " öffnen" },
      h(
        "span",
        { className: "mos__mcard-top" },
        h("span", { className: "mos__mcard-icon" }, h(Icon, { name: m.icon, size: 18 })),
        h("span", { className: "mos__mcard-title" }, m.title)
      ),
      h("span", { className: "mos__mcard-metric" }, m._metric || m.metric),
      h("span", { className: "mos__mcard-sub" }, m._metricSub || m.metricSub),
      h(StatePip, { module: m })
    );
  }
  function MobileHome(props) {
    const cards = ["body", "tasks", "kalender", "engineering", "risel", "journal"].map((id) => props.byId[id]).filter(Boolean);
    return h(
      "div",
      { className: "mos__m-scroll" },
      // Cockpit stack (UI-SPEC §3) — KPI strip · Jarvis teaser · Heute · Firma ·
      // Approvals — the glanceable command surface, above the module grid.
      h(MobileCockpit, {
        byId: props.byId,
        workspace: props.workspace || "private",
        load: props.loadState,
        cockpit: props.cockpit || {},
        cockpitLoad: props.cockpitLoad,
        onGoJarvis: props.onGoJarvis,
        onGoTimeline: props.onGoTimeline,
        onGoApprovals: props.onGoApprovals,
        onGoFirma: props.onGoFirma,
        onArea: props.onArea
      }),
      h(
        "div",
        { className: "mos__mgrid-head" },
        h("span", { className: "mos__m-h3" }, h(Icon, { name: "layout-grid", size: 14 }), "Deine Module")
      ),
      h("div", { className: "mos__mgrid" }, cards.map((m) => h(DomainCardM, { key: m.id, module: m, onOpen: props.onOpen })))
    );
  }
  function ModuleRowM(props) {
    const m = props.module;
    return h(
      "button",
      { type: "button", className: "mos__mrow mos--" + m.accent, onClick: () => props.onOpen(m.id), "aria-label": m.title + " öffnen" },
      h("span", { className: "mos__mrow-icon" }, h(Icon, { name: m.icon, size: 18 })),
      h(
        "span",
        { className: "mos__mrow-body" },
        h("span", { className: "mos__mrow-title" }, m.title),
        h("span", { className: "mos__mrow-meta" }, m.meta)
      ),
      h(StatePip, { module: m }),
      h("span", { className: "mos__mrow-chev", "aria-hidden": "true" }, h(Icon, { name: "chevron-right", size: 18 }))
    );
  }
  function MobileModules(props) {
    return h(
      "div",
      { className: "mos__m-scroll" },
      h("h2", { className: "mos__m-h2" }, "Alle Module"),
      h("div", { className: "mos__mlist" }, props.modules.map((m) => h(ModuleRowM, { key: m.id, module: m, onOpen: props.onOpen })))
    );
  }
  function MobileProfile(props) {
    return h(
      "div",
      { className: "mos__m-scroll" },
      h(
        "section",
        { className: "mos__mprofile" },
        h("span", { className: "mos__mprofile-avatar", "aria-hidden": "true" }, "M"),
        h(
          "span",
          { className: "mos__mprofile-id" },
          h("span", { className: "mos__mprofile-name" }, "Mikael"),
          h("span", { className: "mos__mprofile-sub" }, "Privates System")
        )
      ),
      h(WorkspaceSwitcher, { active: props.workspace, onChange: props.onWorkspace }),
      h(
        "section",
        { className: "mos__mpanel" },
        h("h3", { className: "mos__m-h3" }, h(Icon, { name: "shield-check", size: 14 }), "Privatsphäre & Berechtigungen"),
        h("p", { className: "mos__mpanel-note" }, "Alle Module sind ", h("b", null, "nur lesend"), ". Schreibende Aktionen laufen ausschließlich über Gates (Phase 3)."),
        h("span", { className: "mos__pip mos__pip--konzept" }, h(Icon, { name: "flask-conical", size: 11 }), "Konzeptdaten wo keine Live-Quelle")
      )
    );
  }
  function WaveForm() {
    return h(
      "svg",
      { className: "mos__wave", viewBox: "0 0 320 80", preserveAspectRatio: "none", "aria-hidden": "true" },
      h("path", { d: "M0 40 Q 20 10 40 40 T 80 40 T 120 40 T 160 40 T 200 40 T 240 40 T 280 40 T 320 40", className: "mos__wave-a" }),
      h("path", { d: "M0 40 Q 20 62 40 40 T 80 40 T 120 40 T 160 40 T 200 40 T 240 40 T 280 40 T 320 40", className: "mos__wave-b" })
    );
  }
  function MobileJarvis(props) {
    const st = STATES[props.stateIndex] || STATES[0];
    const label = jarvisStateText(props.stateIndex);
    const active = st.id !== "ready";
    const quick = [
      { icon: "sun", label: "Wetter", accent: "cyan" },
      { icon: "heart-pulse", label: "Recovery", accent: "emerald" },
      { icon: "clock", label: "Deep Work", accent: "amber" }
    ];
    return h(
      "div",
      { className: "mos__mjarvis" },
      h(
        "header",
        { className: "mos__mjarvis-top" },
        h(
          "span",
          { className: "mos__mjarvis-id" },
          h("span", { className: "mos__mjarvis-name" }, "Mikael"),
          h("span", { className: "mos__mjarvis-date" }, TODAY.long)
        ),
        h("span", { className: "mos__mjarvis-avatar", "aria-hidden": "true" }, h(Icon, { name: "circle-user", size: 22 }))
      ),
      h(
        "div",
        { className: "mos__mjarvis-stage" },
        h("div", { className: "mos__mjarvis-orb" + (active ? " is-active" : "") }, h(Orb, null)),
        // state line is a status region so a reader hears "Ich höre zu" on change
        h("span", { className: "mos__mjarvis-state", role: "status", "aria-live": "polite" }, label),
        h(
          "div",
          { className: "mos__mjarvis-wavewrap" },
          h(WaveForm, null),
          h("span", { className: "mos__mjarvis-query" }, active ? "„Wie ist meine Recovery?“" : "Sage „Jarvis“ …")
        )
      ),
      h(
        "button",
        { type: "button", className: "mos__mjarvis-ptt", onClick: props.onSpeak, "aria-label": "Halten zum Sprechen (Demo)" },
        h(Icon, { name: "mic", size: 20 }),
        "Halten zum Sprechen"
      ),
      h(
        "div",
        { className: "mos__mjarvis-quick" },
        quick.map((q) => h(
          "button",
          { key: q.label, type: "button", className: "mos__mquick mos--" + q.accent, onClick: () => props.onQuick(q.label) },
          h("span", { className: "mos__mquick-icon" }, h(Icon, { name: q.icon, size: 20 })),
          q.label
        ))
      ),
      h("span", { className: "mos__mjarvis-note" }, h(Icon, { name: "flask-conical", size: 11 }), "Sprachdemo · schreibt nichts")
    );
  }
  function MobileCommandDock(props) {
    return h(
      "form",
      { className: "mos__mdock", onSubmit: props.onSubmit },
      h("button", { type: "button", className: "mos__mdock-orb", "aria-label": "Sprachbefehl", onClick: props.onSpeak }, h(Icon, { name: "mic", size: 20 })),
      h("input", {
        className: "mos__mdock-input",
        type: "text",
        "aria-label": "Befehl eingeben",
        placeholder: "Sage Jarvis …",
        value: props.command,
        onChange: (e) => props.onCommand(e.target.value)
      }),
      h("button", { type: "submit", className: "mos__mdock-send", "aria-label": "Senden" }, h(Icon, { name: "send-horizontal", size: 16 }))
    );
  }
  function MobileTabBar(props) {
    return h(
      "nav",
      { className: "mos__mtabs", "aria-label": "Hauptnavigation" },
      M_TABS.map((t) => {
        const isJarvis = t.id === "jarvis";
        return h(
          "button",
          {
            key: t.id,
            type: "button",
            className: "mos__mtab" + (props.active === t.id ? " is-active" : "") + (isJarvis ? " mos__mtab--jarvis" : ""),
            "aria-current": props.active === t.id ? "page" : void 0,
            onClick: () => props.onChange(t.id)
          },
          isJarvis ? h(
            "span",
            { className: "mos__mtab-orb", "aria-hidden": "true" },
            h("span", { className: "mos__mtab-orb-core" }),
            h(Icon, { name: "mic", size: 20 })
          ) : h("span", { className: "mos__mtab-icon" }, h(Icon, { name: t.icon, size: 22 })),
          h("span", { className: "mos__mtab-label" }, t.label)
        );
      })
    );
  }
  const SHEET_DETENTS = [46, 76, 100];
  function MobileSheet(props) {
    const [dragVh, setDragVh] = useState(null);
    const dragRef = useRef(null);
    const dragVhRef = useRef(null);
    const sheetRef = useRef(null);
    const restoreRef = useRef(null);
    const setDrag = (v) => {
      dragVhRef.current = v;
      setDragVh(v);
    };
    useEffect(() => {
      function move(ev) {
        const d = dragRef.current;
        if (!d) return;
        const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
        const vh = Math.max(16, Math.min(100, d.startVh + (d.startY - cy) / window.innerHeight * 100));
        setDrag(vh);
      }
      function up() {
        const d = dragRef.current;
        if (!d) return;
        dragRef.current = null;
        const cur = dragVhRef.current != null ? dragVhRef.current : SHEET_DETENTS[props.detent];
        if (Math.abs(cur - d.startVh) < 3) {
          setDrag(null);
          props.onDetent((props.detent + 1) % SHEET_DETENTS.length);
          return;
        }
        if (cur < 30) {
          setDrag(null);
          props.onClose();
          return;
        }
        let best = 0, bd = 1e9;
        SHEET_DETENTS.forEach((hh, i) => {
          const dd = Math.abs(hh - cur);
          if (dd < bd) {
            bd = dd;
            best = i;
          }
        });
        setDrag(null);
        props.onDetent(best);
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("touchmove", move, { passive: true });
      window.addEventListener("touchend", up);
      return () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("touchmove", move);
        window.removeEventListener("touchend", up);
      };
    }, [props.detent, props.open, props.onClose, props.onDetent]);
    useEffect(() => {
      if (!props.open) return;
      restoreRef.current = typeof document !== "undefined" && document.activeElement || null;
      const el = sheetRef.current;
      if (el && el.focus) {
        try {
          el.focus();
        } catch (_e) {
        }
      }
      return () => {
        const r = restoreRef.current;
        if (r && r.focus) {
          try {
            r.focus();
          } catch (_e) {
          }
        }
      };
    }, [props.open]);
    if (!props.open) return null;
    const data = resolveLens(props.focusId, props.liveModule);
    const stMeta = STATE_META[data.state] || STATE_META.loading;
    const height = dragVh != null ? dragVh : SHEET_DETENTS[props.detent];
    const startDrag = (ev) => {
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      dragRef.current = { startY: cy, startVh: height };
    };
    return h(
      "div",
      { className: "mos__sheet-scrim", onClick: props.onClose },
      h(
        "section",
        {
          ref: sheetRef,
          className: "mos__sheet" + (dragVh != null ? " is-dragging" : ""),
          style: { height: height + "vh" },
          role: "dialog",
          "aria-modal": "true",
          "aria-label": "Fokus: " + data.title,
          tabIndex: -1,
          onClick: (e) => e.stopPropagation()
        },
        h(
          "button",
          { type: "button", className: "mos__sheet-grab", "aria-label": "Größe ändern", onPointerDown: startDrag, onTouchStart: startDrag },
          h("span", { className: "mos__sheet-grab-bar", "aria-hidden": "true" })
        ),
        h(
          "header",
          { className: "mos__sheet-head" },
          h("span", { className: "mos__sheet-badge mos--" + data.accent }, h(Icon, { name: data.icon, size: 20 })),
          h(
            "span",
            { className: "mos__sheet-titles" },
            h("span", { className: "mos__sheet-title" }, data.title),
            h("span", { className: "mos__sheet-sub" }, data.sub),
            h(
              "span",
              { className: "mos__pip mos__pip--" + (data.demo ? "konzept" : stMeta.tone) },
              data.demo ? h(Icon, { name: "flask-conical", size: 11 }) : h("span", { className: "mos__pip-dot", "aria-hidden": "true" }),
              data.demo ? "Konzept" : stMeta.label
            )
          ),
          h("button", { type: "button", className: "mos__iconbtn mos__iconbtn--close", "aria-label": "Schließen", onClick: props.onClose }, h(Icon, { name: "x", size: 18 }))
        ),
        function() {
          const allRows = data.rows || [];
          const rows = allRows.slice(0, LENS_MAX_ROWS);
          const extra = allRows.length - rows.length;
          return h(
            "div",
            { className: "mos__sheet-body" },
            rows.length ? [
              ...rows.map((r, i) => h(LensRow, { key: r.title + i, row: r, index: i + 1 })),
              extra > 0 ? h(
                "div",
                { key: "more", className: "mos__lens-more" },
                h(Icon, { name: "ellipsis", size: 14 }),
                "+" + extra + " weitere",
                h("span", { className: "mos__lens-more-src" }, " · " + data.source)
              ) : null
            ] : h(
              "div",
              { className: "mos__lens-empty mos--" + stMeta.tone },
              h(Icon, { name: data.state === "unavailable" || data.state === "error" ? "unplug" : "inbox", size: 22 }),
              h("span", { className: "mos__lens-empty-title" }, stMeta.label),
              h("span", { className: "mos__lens-empty-note" }, data.note || "Keine Daten von dieser Quelle.")
            )
          );
        }(),
        h(
          "footer",
          { className: "mos__sheet-foot" },
          // Phase-3 actions are shown but explicitly NOT wired — no write path
          // exists yet. Buttons are disabled + carry a "Gate" pill so the surface
          // is honest about what it can and cannot do (no gate bypass).
          h(
            "div",
            { className: "mos__sheet-actions", "aria-label": "Aktionen" },
            // "Als Codex-Task" is the ONE wired action (propose-only, gate-led).
            // "Termin vorschlagen" (Kalender) + FSM stay honestly not-connected.
            h(
              "button",
              {
                key: "propose",
                type: "button",
                className: "mos__sheet-act mos__sheet-act--propose",
                onClick: () => props.onPropose && props.onPropose(data.title || ""),
                title: "Baut eine Dry-Run-Vorschau — sendet nichts, bis du klickst."
              },
              h(Icon, { name: "git-branch", size: 15 }),
              "Als Codex-Task",
              h("span", { className: "mos__sheet-act-gate mos__sheet-act-gate--live" }, h(Icon, { name: "shield-check", size: 10 }), "propose")
            ),
            // Lernplan gets the wired read-only drill (Vorschau, nichts gespeichert).
            props.onReview && props.focusId === "learning" ? h(
              "button",
              {
                key: "review",
                type: "button",
                className: "mos__sheet-act mos__sheet-act--review",
                onClick: () => props.onReview(),
                title: "Karten üben (Vorschau) — Bewertung & Speicherung in Anki/AnkiDroid."
              },
              h(Icon, { name: "play", size: 15 }),
              "Lernen · Drill",
              h("span", { className: "mos__sheet-act-gate mos__sheet-act-gate--live" }, h(Icon, { name: "eye", size: 10 }), "read-only")
            ) : null,
            // L-3: Lern-Coach (Countdown · Feynman via Jarvis · Lernplan-Vorschlag).
            props.onCoach && props.focusId === "learning" ? h(
              "button",
              {
                key: "coach",
                type: "button",
                className: "mos__sheet-act mos__sheet-act--coach",
                onClick: () => props.onCoach(),
                title: "Countdown, Feynman (von Jarvis bewertet) und Lernplan-Vorschlag (gated)."
              },
              h(Icon, { name: "graduation-cap", size: 15 }),
              "Lern-Coach",
              h("span", { className: "mos__sheet-act-gate mos__sheet-act-gate--live" }, h(Icon, { name: "sparkles", size: 10 }), "Jarvis")
            ) : null,
            h(
              "button",
              {
                key: "cal",
                type: "button",
                className: "mos__sheet-act",
                disabled: true,
                "aria-disabled": "true",
                title: "Noch nicht verbunden — Kalender-Vorschlag folgt (über Gates, propose-only)."
              },
              h(Icon, { name: "calendar-plus", size: 15 }),
              "Termin vorschlagen",
              h("span", { className: "mos__sheet-act-gate" }, h(Icon, { name: "lock", size: 10 }), "nicht verbunden")
            )
          ),
          h(
            "span",
            { className: "mos__sheet-prov" },
            h(Icon, { name: "git-branch", size: 12 }),
            "Quelle ",
            h("b", null, data.source),
            " · Stand ",
            h("b", null, data.freshness),
            " · ",
            data.permission
          ),
          h("button", { type: "button", className: "mos__sheet-cta mos--" + data.accent }, h(Icon, { name: "panels-top-left", size: 16 }), "Details anzeigen")
        )
      )
    );
  }
  const MSCREEN_META = {
    firma: { title: "Firma / Rise-L", sub: "read-only Projektion · Deep-Links ins FSM" },
    approvals: { title: "Entscheidungen", sub: "Entscheidung nur durch dich (Operator)" },
    wissen: { title: "Wissen & Suche", sub: "föderiert · Workspace je Treffer · nur lesen" },
    kommunikation: { title: "Kommunikation", sub: "nur Signale · Versand G7-gated" },
    sessions: { title: "Sessions / Agenten", sub: "mission.v2 + Broker · Steuern gated" },
    ziele: { title: "Ziele & Systeme", sub: "mission.v2 + Policy · keine neue Task-DB" },
    reflexion: { title: "Reflexion", sub: "strikt privat · nur lesen · kein Versand" },
    gesundheit: { title: "Gesundheit", sub: "WHOOP :18090 · privat · nur lesen" }
  };
  function MobileScreen(props) {
    const kind = props.kind;
    const meta = MSCREEN_META[kind] || MSCREEN_META.firma;
    let body;
    if (kind === "firma") {
      body = h(FirmaScene, { firma: props.firma, load: props.firmaLoad });
    } else if (kind === "approvals") {
      body = h(ApprovalsScene, {
        approvals: props.approvals,
        load: props.cockpitLoad,
        details: props.details,
        detailLoading: props.detailLoading,
        onLoadDetail: props.onLoadDetail
      });
    } else if (kind === "wissen") {
      body = h(WissenScene, {
        data: props.wissen,
        load: props.wissenLoad,
        query: props.wissenQuery,
        onQuery: props.onWissenQuery,
        onSearch: props.onWissenSearch
      });
    } else if (kind === "kommunikation") {
      body = h(KommunikationScene, { data: props.komm, load: props.kommLoad });
    } else if (kind === "sessions") {
      body = h(SessionsScene, { data: props.sessions, load: props.sessionsLoad });
    } else if (kind === "ziele") {
      body = h(ZieleScene, { data: props.ziele, load: props.zieleLoad });
    } else if (kind === "reflexion") {
      body = h(ReflexionScene, { data: props.reflexion, load: props.reflexionLoad });
    } else if (kind === "gesundheit") {
      body = h(GesundheitScene, { data: props.gesundheit, load: props.gesundheitLoad });
    }
    return h(
      "div",
      { className: "mos__mscreen mos__mscreen--" + kind, role: "region", "aria-label": meta.title },
      h(
        "header",
        { className: "mos__mscreen-top" },
        h(
          "button",
          { type: "button", className: "mos__mscreen-back", onClick: props.onBack, "aria-label": "Zurück zum Cockpit" },
          h(Icon, { name: "chevron-left", size: 22 })
        ),
        h(
          "span",
          { className: "mos__mscreen-titles" },
          h("span", { className: "mos__mscreen-title" }, meta.title),
          h("span", { className: "mos__mscreen-sub" }, h(Icon, { name: "lock", size: 11 }), meta.sub)
        )
      ),
      h("main", { className: "mos__mscreen-body" }, body)
    );
  }
  function MobileShell(props) {
    const tab = props.mobileTab;
    if (props.mobileScreen) {
      return h(MobileScreen, {
        kind: props.mobileScreen,
        onBack: props.onScreenBack,
        firma: props.firma,
        firmaLoad: props.firmaLoad,
        approvals: props.cockpit && props.cockpit.approvals,
        cockpitLoad: props.cockpitLoad,
        details: props.approvalDetails,
        detailLoading: props.approvalDetailLoading,
        onLoadDetail: props.onLoadDetail,
        wissen: props.wissen,
        wissenLoad: props.wissenLoad,
        wissenQuery: props.wissenQuery,
        onWissenQuery: props.onWissenQuery,
        onWissenSearch: props.onWissenSearch,
        komm: props.komm,
        kommLoad: props.kommLoad,
        sessions: props.sessions,
        sessionsLoad: props.sessionsLoad,
        ziele: props.ziele,
        zieleLoad: props.zieleLoad,
        reflexion: props.reflexion,
        reflexionLoad: props.reflexionLoad,
        gesundheit: props.gesundheit,
        gesundheitLoad: props.gesundheitLoad
      });
    }
    const showDock = tab !== "jarvis" && tab !== "timeline";
    let content;
    if (tab === "timeline") {
      content = h(
        "div",
        { className: "mos__m-scroll" },
        h(
          "div",
          { className: "mos__mtl-head" },
          h("span", { className: "mos__tl-head-icon" }, h(Icon, { name: "waypoints", size: 18 })),
          h(
            "span",
            { className: "mos__tl-head-titles" },
            h("span", { className: "mos__tl-head-title" }, "Living Timeline"),
            h("span", { className: "mos__tl-head-sub" }, TODAY.long)
          )
        ),
        h(TimelineAxis, { byId: props.byId, activeEventId: (TIMELINE.find((e) => e.moduleId === props.focusId) || {}).id, onActivate: props.onOpen, showNow: true })
      );
    } else if (tab === "jarvis") {
      content = h(MobileJarvis, { stateIndex: props.stateIndex, onSpeak: props.onSpeak, onQuick: props.onQuick });
    } else if (tab === "module") {
      content = h(MobileModules, { modules: props.modules, onOpen: props.onOpen });
    } else if (tab === "profil") {
      content = h(MobileProfile, { workspace: props.workspace, onWorkspace: props.onWorkspace });
    } else {
      content = h(MobileHome, {
        byId: props.byId,
        modules: props.modules,
        onOpen: props.onOpen,
        stateIndex: props.stateIndex,
        greeting: props.greeting,
        onGoJarvis: props.onGoJarvis,
        workspace: props.workspace,
        loadState: props.loadState,
        cockpit: props.cockpit,
        cockpitLoad: props.cockpitLoad,
        onChip: props.onChip,
        onGoTimeline: props.onGoTimeline,
        onGoApprovals: props.onGoApprovals,
        onGoFirma: props.onGoFirma,
        onArea: props.onArea
      });
    }
    return h(
      "div",
      { className: "mos__m" },
      h("h1", { className: "mos__sr-only" }, "MIKAEL OS — Persönliches System"),
      h(LiveAnnouncer, { message: props.announce }),
      // The Jarvis surface has its own name/date header; the Timeline tab carries a
      // single compact "Living Timeline" header of its own — so the global MIKAEL OS
      // bar is suppressed on both to avoid a stacked double header (and, on Timeline,
      // a second clock that could disagree with the "now" marker).
      tab === "jarvis" || tab === "timeline" ? null : h(MobileTopBar, { loadState: props.loadState, liveCount: props.liveCount }),
      h("main", { className: "mos__m-main", role: "main" }, content),
      showDock ? h(MobileCommandDock, { command: props.command, onCommand: props.onCommand, onSubmit: props.onSubmit, onSpeak: props.onSpeak }) : null,
      h(MobileTabBar, { active: tab, onChange: props.onMobileTab }),
      h(MobileSheet, {
        open: props.sheetOpen,
        detent: props.sheetDetent,
        onDetent: props.onSheetDetent,
        onClose: props.onSheetClose,
        focusId: props.focusId,
        liveModule: props.byId[props.focusId],
        onPropose: props.onPropose,
        onReview: props.onReview,
        onCoach: props.onCoach
      })
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
          h("span", { className: "mos__identity-sub" }, "Privates System")
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
                title: "Phase 2: " + liveN + " Module projizieren echte Read-Modelle (mission.v2 / WHOOP / systemd / Approval-Cards); übrige bleiben Konzept."
              },
              h(Icon, { name: "activity", size: 14 }),
              liveN + " Live · " + Math.max(0, (props.total || 0) - liveN) + " Konzept"
            );
          }
          return h(
            "span",
            { className: "mos__concept", title: ls === "offline" ? "Read-Modelle nicht erreichbar — Konzeptdaten angezeigt." : "Konzeptdaten. Keine Live-Wahrheit." },
            h(Icon, { name: "flask-conical", size: 14 }),
            ls === "offline" ? "Quellen offline · Konzept" : "Konzeptdaten"
          );
        }(),
        // Weather is DROPPED on the M2 drill-down scenes: there is no weather data
        // source in the stack, so a "22° Klar" reading would be a fabricated value —
        // the honesty doctrine forbids it. The clock (real, static) stays.
        props.onBack ? null : h(
          "span",
          { className: "mos__topchip" },
          h(Icon, { name: "cloud-moon", size: 16 }),
          h("strong", null, "22°"),
          " Klar"
        ),
        h(
          "span",
          { className: "mos__topchip mos__topchip-time" },
          // Scene-consistent clock: on the Timeline the bar shows the same "now"
          // the Jarvis marker sits at (16:42), so a single screen never shows two
          // contradicting times; the Konstellation keeps its night reference time.
          h("b", null, props.scene === "timeline" ? TIMELINE_NOW.time : "22:30"),
          h("span", null, TODAY.short + " · Berliner Zeit")
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
    { id: "countdown", icon: "calendar-clock", label: "Countdown" },
    { id: "feynman", icon: "message-square", label: "Feynman" },
    { id: "plan", icon: "list-todo", label: "Lernplan" }
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
            h("span", { className: "mos__co-head-sub" }, "Klausur-Countdown · Feynman · Lernplan")
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
  const KPI_META = {
    recovery: { icon: "heart-pulse", accent: "emerald" },
    next_exam: { icon: "graduation-cap", accent: "violet" },
    open_gates: { icon: "shield-check", accent: "amber" },
    running_jobs: { icon: "rocket", accent: "cyan" }
  };
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
  function KpiPill(props) {
    const k = props.kpi;
    const meta = KPI_META[k.key] || { icon: "circle", accent: "cyan" };
    const st = k.state || "loading";
    const tone = ZONE_TONE[st] || "muted";
    const spinning = st === "loading";
    const hasVal = k.value !== null && k.value !== void 0 && k.value !== "";
    const tip = [k.summary, k.note, k.source && "Quelle: " + k.source].filter(Boolean).join(" · ");
    return h(
      "button",
      {
        type: "button",
        className: "mos__kpi mos__kpi--" + tone + " mos--" + meta.accent + (props.onClick ? " is-click" : ""),
        title: tip || k.label,
        onClick: props.onClick,
        "aria-label": k.label + ": " + (hasVal ? k.value + (k.unit ? " " + k.unit : "") : "kein Wert (" + (STATE_META[st] || STATE_META.loading).label + ")")
      },
      h("span", { className: "mos__kpi-ico" }, h(Icon, { name: spinning ? "loader" : meta.icon, size: 18, className: spinning ? "is-spin" : "" })),
      h(
        "span",
        { className: "mos__kpi-main" },
        h("span", { className: "mos__kpi-label" }, k.label),
        h(
          "span",
          { className: "mos__kpi-val" },
          hasVal ? [String(k.value), k.unit ? h("i", { key: "u", className: "mos__kpi-unit" }, k.unit) : null] : h("span", { className: "mos__kpi-dash", title: k.note || k.summary || "" }, "—")
        )
      ),
      h("span", { className: "mos__kpi-pip mos__pip mos__pip--" + tone }, h("span", { className: "mos__pip-dot", "aria-hidden": "true" }))
    );
  }
  const KPI_FALLBACK = [
    { key: "recovery", label: "Recovery", unit: "%" },
    { key: "next_exam", label: "Nächste Klausur", unit: "Tage" },
    { key: "open_gates", label: "Offene Freigaben", unit: null },
    { key: "running_jobs", label: "Laufende Jobs", unit: null }
  ];
  function KpiBar(props) {
    const c = props.cockpit || {};
    const load = props.load;
    const real = c.kpi && Array.isArray(c.kpi.kpis) && c.kpi.kpis.length;
    const kpis = real ? c.kpi.kpis : KPI_FALLBACK.map((f) => ({ ...f, value: null, state: load === "loading" ? "loading" : "unavailable" }));
    return h(
      "div",
      { className: "mos__kpibar", role: "group", "aria-label": "Kennzahlen" },
      kpis.map((k) => h(KpiPill, { key: k.key, kpi: k, onClick: k.key === "open_gates" ? props.onGates : void 0 }))
    );
  }
  function AgendaRow(props) {
    const r = props.row;
    const wtag = WS_TAG[r.workspace];
    return h(
      "div",
      { className: "mos__agrow mos--" + (r.accent || "cyan") + (r.readOnly ? " is-ro" : "") },
      h("span", { className: "mos__agrow-time" }, r.value || "—"),
      h("span", { className: "mos__agrow-ico" }, h(Icon, { name: r.icon || "calendar-days", size: 15 })),
      h(
        "span",
        { className: "mos__agrow-body" },
        h("span", { className: "mos__agrow-title" }, r.title),
        r.sub ? h("span", { className: "mos__agrow-sub" }, r.sub) : null
      ),
      wtag ? h("span", { className: "mos__wtag mos__wtag--" + wtag.tone, title: r.workspace }, wtag.label) : null
    );
  }
  const AGENDA_MAX = 4;
  function AgendaRail(props) {
    const ws = props.workspace;
    const eng = ws === "engineering";
    const src = eng ? props.engineeringModule : props.todayModule;
    const st = src ? src._state || "loading" : props.load === "loading" ? "loading" : "empty";
    let rows = src && Array.isArray(src._rows) ? src._rows.slice() : [];
    if (!eng && ws === "private") rows = rows.filter((r) => (r.workspace || "private") === "private");
    const head = eng ? "Arbeitsstränge" : "Heute";
    const headIcon = eng ? "git-branch" : "sun";
    const shown = rows.slice(0, AGENDA_MAX);
    const extra = rows.length - shown.length;
    const demo = src && src._demo;
    return h(
      "section",
      { className: "mos__card mos__agenda" },
      h(
        "header",
        { className: "mos__card-head" },
        h(Icon, { name: headIcon, size: 16 }),
        h("span", { className: "mos__card-title" }, head),
        h(ZonePip, { state: demo ? "konzept" : st, observedAt: src && src._observedAt, source: src && src._source, note: src && src._note })
      ),
      h(
        "div",
        { className: "mos__agenda-body" },
        props.load === "loading" && !src ? [0, 1, 2].map((i) => h("div", { key: i, className: "mos__skrow" })) : shown.length ? [
          ...shown.map((r, i) => h(AgendaRow, { key: i, row: r })),
          extra > 0 ? h(
            "button",
            { key: "more", type: "button", className: "mos__agenda-more", onClick: props.onMore },
            h(Icon, { name: "ellipsis", size: 14 }),
            "+" + extra + " weitere"
          ) : null
        ] : h(ZoneEmpty, { state: st, icon: "calendar-days", title: eng ? "Keine Arbeitsstränge" : "Keine Termine heute", note: src && src._note })
      )
    );
  }
  function JarvisBubble(props) {
    const b = props.bubble;
    return h(
      "div",
      { className: "mos__jbub is-" + (b.tone || "cyan") },
      h("span", { className: "mos__jbub-ava" }, h(Icon, { name: b.icon || "orbit", size: 14 })),
      h(
        "div",
        { className: "mos__jbub-body" },
        b.title ? h("span", { className: "mos__jbub-title" }, b.title) : null,
        h("span", { className: "mos__jbub-text" }, b.text),
        b.source || b.workspace ? h(
          "span",
          { className: "mos__jbub-meta" },
          b.workspace && WS_TAG[b.workspace] ? h("span", { className: "mos__wtag mos__wtag--" + WS_TAG[b.workspace].tone }, WS_TAG[b.workspace].label) : null,
          b.source ? h("span", { className: "mos__jbub-src" }, b.source) : null
        ) : null
      )
    );
  }
  function SuggestionCard(props) {
    const hint = props.hint;
    const obj = hint.propose && hint.propose.objective;
    return h(
      "div",
      { className: "mos__suggest" },
      h(
        "div",
        { className: "mos__suggest-head" },
        h(Icon, { name: "flask-conical", size: 15 }),
        h("span", { className: "mos__suggest-kind" }, "Vorschlag · propose-only (Dry-Run)"),
        h("span", { className: "mos__suggest-tag" }, h(Icon, { name: "shield-check", size: 12 }), "Gate entscheidet")
      ),
      h("div", { className: "mos__suggest-title" }, hint.title),
      hint.detail ? h("div", { className: "mos__suggest-detail" }, hint.detail) : null,
      h(
        "div",
        { className: "mos__suggest-foot" },
        h(
          "button",
          {
            type: "button",
            className: "mos__suggest-btn",
            onClick: () => props.onPropose(obj),
            title: "Baut eine Dry-Run-Vorschau — sendet nichts, bis du klickst."
          },
          h(Icon, { name: "git-branch", size: 15 }),
          "Als Codex-Aufgabe vorschlagen"
        ),
        h("span", { className: "mos__suggest-note" }, "Nichts wird ausgeführt.")
      )
    );
  }
  function JarvisLive(props) {
    const j = props.jarvis;
    const load = props.load;
    const ws = props.workspace;
    const chat = j && j.chat;
    const hints = j && Array.isArray(j.hints) ? j.hints.filter((x) => x.id !== "gates_pending") : [];
    const proposeHint = hints.find((x) => x.propose);
    const showPropose = proposeHint && ws === "engineering";
    const bubbles = [];
    if (chat) {
      bubbles.push(chat.connected ? { icon: "orbit", tone: "cyan", title: "Coaching-Chat verbunden", text: chat.scope || chat.note || "Brain-Gateway erreichbar." } : { icon: "unplug", tone: "red", title: "Jarvis-Chat nicht verbunden", text: chat.note || "Chat-Backend nicht erreichbar — keine Antwort erfunden." });
    } else if (load === "offline") {
      bubbles.push({ icon: "unplug", tone: "red", title: "Jarvis nicht erreichbar", text: "Read-Modelle offline — der Zustand erscheint, sobald die Quelle wieder antwortet." });
    }
    hints.forEach((x) => {
      if (x === proposeHint && showPropose) return;
      bubbles.push({
        icon: x.icon || "lightbulb",
        tone: x.severity === "attention" ? "amber" : "cyan",
        title: x.title,
        text: x.detail,
        source: x.source,
        workspace: x.workspace
      });
    });
    const empty = !chat && load !== "offline" && load !== "loading" && !hints.length;
    const chatOk = chat && chat.connected;
    return h(
      "section",
      { className: "mos__card mos__jlive" },
      h(
        "header",
        { className: "mos__jlive-head" },
        h("span", { className: "mos__jlive-orb" }, h(Orb, { label: false })),
        h(
          "span",
          { className: "mos__jlive-id" },
          h("b", null, "Jarvis"),
          h("span", { className: "mos__jlive-sub" }, jarvisStateText(props.stateIndex))
        ),
        h("span", { className: "mos__jlive-ws mos__wtag mos__wtag--" + ((WS_TAG[ws] || {}).tone || "cyan") }, (WS_TAG[ws] || {}).label || ws),
        chat ? h(
          "span",
          { className: "mos__pip mos__pip--" + (chatOk ? "verified" : "red"), title: chat.note || "" },
          h("span", { className: "mos__pip-dot", "aria-hidden": "true" }),
          chatOk ? "Chat bereit" : "Chat offline"
        ) : h("span", { className: "mos__jlive-load" }, h(Icon, { name: load === "loading" ? "loader" : "unplug", size: 14, className: load === "loading" ? "is-spin" : "" })),
        h("button", { type: "button", className: "mos__jlive-mic", title: NOT_WIRED, "aria-label": "Voice-Memo (folgt)" }, h(Icon, { name: "mic", size: 18 }))
      ),
      h(
        "div",
        { className: "mos__jlive-stream" },
        load === "loading" && !j ? [0, 1].map((i) => h("div", { key: i, className: "mos__skbub" })) : empty ? h(
          "div",
          { className: "mos__jlive-greet" },
          h("span", { className: "mos__jlive-greet-t" }, (props.greeting || "Hallo") + ", Mikael."),
          h("span", { className: "mos__jlive-greet-s" }, "Kein offener Hinweis. Frag mich etwas oder wähle einen Vorschlag."),
          h(
            "div",
            { className: "mos__jlive-chips" },
            CHIPS.slice(0, 3).map((c) => h(
              "button",
              { key: c.label, type: "button", className: "mos__chip", onClick: () => props.onChip(c.label) },
              h(Icon, { name: c.icon, size: 14 }),
              c.label
            ))
          )
        ) : [
          ...bubbles.map((b, i) => h(JarvisBubble, { key: i, bubble: b })),
          showPropose ? h(SuggestionCard, { key: "sug", hint: proposeHint, onPropose: props.onPropose }) : null
        ]
      )
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
  function FirmaPanel(props) {
    const risel = props.risel, company = props.company, load = props.load;
    const rst = risel ? risel._state || "loading" : load === "loading" ? "loading" : "empty";
    const rows = risel && Array.isArray(risel._rows) ? risel._rows.slice(0, 3) : [];
    const demo = risel && risel._demo;
    return h(
      "section",
      { className: "mos__card mos__firma" },
      h(
        "header",
        { className: "mos__card-head" },
        h(Icon, { name: "server", size: 16 }),
        h("span", { className: "mos__card-title" }, "Firma / Rise-L"),
        props.onOpen ? h(
          "button",
          {
            type: "button",
            className: "mos__card-open mos__card-open--icon",
            onClick: props.onOpen,
            title: "Vollansicht — Firma/Rise-L (read-only Projektion, Deep-Links ins FSM)",
            "aria-label": "Firma-Vollansicht öffnen"
          },
          h(Icon, { name: "arrow-up-right", size: 15 })
        ) : null,
        h(ZonePip, { state: demo ? "konzept" : rst, observedAt: risel && risel._observedAt, source: risel && risel._source, note: risel && risel._note })
      ),
      h(
        "div",
        { className: "mos__firma-body" },
        load === "loading" && !risel ? [0, 1, 2].map((i) => h("div", { key: i, className: "mos__skrow" })) : rows.length ? rows.map((r, i) => h(FirmaMetric, { key: i, row: r })) : h(ZoneEmpty, { state: rst, icon: "server", title: "Keine Signale", note: risel && risel._note })
      ),
      company ? h(
        "footer",
        { className: "mos__firma-foot" },
        h(Icon, { name: "building-2", size: 13 }),
        h("span", { className: "mos__firma-foot-t" }, company.meta || "Firma-Signale"),
        h("span", { className: "mos__firma-foot-ro" }, h(Icon, { name: "lock", size: 11 }), "nur lesen")
      ) : null
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
  const M3_AREAS = [
    {
      id: "wissen",
      icon: "search",
      accent: "cyan",
      title: "Wissen & Suche",
      sub: "Föderiert · Workspace je Treffer"
    },
    {
      id: "kommunikation",
      icon: "radio-tower",
      accent: "violet",
      title: "Kommunikation",
      sub: "Telegram · Hermes · FreeScout"
    },
    {
      id: "sessions",
      icon: "waypoints",
      accent: "cyan",
      title: "Sessions / Agenten",
      sub: "Stränge · mission.v2 · steuern gated"
    },
    // M4 peers (same launch mechanism, same read-only peer-scene contract).
    {
      id: "ziele",
      icon: "target",
      accent: "emerald",
      title: "Ziele & Systeme",
      sub: "mission.v2 + Policy · keine neue Task-DB"
    },
    {
      id: "reflexion",
      icon: "notebook-pen",
      accent: "violet",
      title: "Reflexion",
      sub: "Journal · Entscheidungen · Erkenntnisse"
    },
    {
      id: "gesundheit",
      icon: "heart-pulse",
      accent: "emerald",
      title: "Gesundheit",
      sub: "WHOOP · Recovery · Schlaf · Strain"
    }
  ];
  function AreaLauncher(props) {
    return h(
      "nav",
      { className: "mos__arealaunch", "aria-label": "Bereiche öffnen" },
      M3_AREAS.map((a) => h(
        "button",
        {
          key: a.id,
          type: "button",
          className: "mos__arealaunch-btn mos--" + a.accent,
          onClick: () => props.onOpen(a.id),
          "aria-label": a.title + " öffnen"
        },
        h("span", { className: "mos__arealaunch-ico" }, h(Icon, { name: a.icon, size: 18 })),
        h(
          "span",
          { className: "mos__arealaunch-body" },
          h("span", { className: "mos__arealaunch-title" }, a.title),
          h("span", { className: "mos__arealaunch-sub" }, a.sub)
        ),
        h(Icon, { name: "arrow-up-right", size: 15, className: "mos__arealaunch-go" })
      ))
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
      // Gated controls — sichtbar-aber-gesperrt, never a working steer/continue.
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
            title: "Öffnen/Steuern nur über den propose-Weg (gated) — hier nicht ausführbar."
          },
          h(Icon, { name: "eye", size: 12 }),
          "öffnen"
        ),
        h(
          "button",
          {
            type: "button",
            disabled: true,
            "aria-disabled": "true",
            className: "mos__sess-act is-gated",
            title: "Verfolgen/Steer bleibt gated (propose-only) — hier nicht ausführbar."
          },
          h(Icon, { name: "waypoints", size: 12 }),
          "verfolgen",
          h(Icon, { name: "lock", size: 11 })
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
          (s.source ? s.source : "read-only") + " · steuern gated"
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
      // The gated-controls caption — steer/continue/bind never execute from here.
      h(
        "div",
        { className: "mos__kbanner mos__kbanner--sessions" },
        h(Icon, { name: "lock", size: 14 }),
        h("span", null, ov && ov.controls && ov.controls.note || "Steuern/Continue/Steer/Bind bleiben gated (propose-only) — hier nicht ausführbar.")
      )
    );
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
  function CockpitScene(props) {
    return h(
      "div",
      { className: "mos__ckpt" },
      h(
        "aside",
        { className: "mos__ckpt-col mos__ckpt-left" },
        h(WorkspaceSwitcher, { active: props.workspace, onChange: props.onWorkspace }),
        h(AgendaRail, {
          workspace: props.workspace,
          todayModule: props.byId.today,
          engineeringModule: props.byId.engineering,
          load: props.load,
          onMore: props.onAgendaMore
        })
      ),
      h(
        "section",
        { className: "mos__ckpt-col mos__ckpt-center" },
        h(JarvisLive, {
          jarvis: props.cockpit.jarvis,
          load: props.cockpitLoad,
          workspace: props.workspace,
          stateIndex: props.stateIndex,
          greeting: props.greeting,
          onPropose: props.onPropose,
          onChip: props.onChip
        })
      ),
      h(
        "aside",
        { className: "mos__ckpt-col mos__ckpt-right" },
        h(FirmaPanel, { risel: props.byId.risel, company: props.byId.company, load: props.load, onOpen: props.onFirma }),
        h(ApprovalCenter, {
          approvals: props.cockpit.approvals,
          load: props.cockpitLoad,
          flash: props.approvalsFlash,
          innerRef: props.approvalsRef,
          onOpen: props.onApprovals
        })
      )
    );
  }
  function MobileCockpit(props) {
    const c = props.cockpit || {};
    const j = c.jarvis;
    const chat = j && j.chat;
    const hints = j && Array.isArray(j.hints) ? j.hints.filter((x) => x.id !== "gates_pending") : [];
    const topHint = hints[0];
    const chatOk = chat && chat.connected;
    return h(
      "div",
      { className: "mos__mckpt" },
      // KPI strip — horizontal scroll, 2 visible + fade edge.
      h(
        "div",
        { className: "mos__mckpt-kpis" },
        h(KpiBar, { cockpit: c, load: props.cockpitLoad, onGates: props.onGoApprovals })
      ),
      // Jarvis teaser → opens the full jarvis tab.
      h(
        "button",
        { type: "button", className: "mos__mckpt-jarvis", onClick: props.onGoJarvis, "aria-label": "Jarvis öffnen" },
        h("span", { className: "mos__mckpt-orb" }, h(Orb, { label: false })),
        h(
          "span",
          { className: "mos__mckpt-jbody" },
          h(
            "span",
            { className: "mos__mckpt-jhead" },
            h("b", null, "Jarvis"),
            chat ? h(
              "span",
              { className: "mos__pip mos__pip--" + (chatOk ? "verified" : "red") },
              h("span", { className: "mos__pip-dot", "aria-hidden": "true" }),
              chatOk ? "Chat bereit" : "Chat offline"
            ) : null
          ),
          h(
            "span",
            { className: "mos__mckpt-jline" },
            topHint ? topHint.title : props.cockpitLoad === "loading" ? "Lädt Zustand …" : "Kein offener Hinweis."
          )
        ),
        h(Icon, { name: "chevron-right", size: 18 })
      ),
      // M3 area launch tiles (Wissen / Kommunikation / Sessions) — same peer screens.
      h(
        "nav",
        { className: "mos__marealaunch", "aria-label": "Bereiche öffnen" },
        M3_AREAS.map((a) => h(
          "button",
          {
            key: a.id,
            type: "button",
            className: "mos__marealaunch-btn mos--" + a.accent,
            onClick: () => props.onArea && props.onArea(a.id),
            "aria-label": a.title + " öffnen"
          },
          h(Icon, { name: a.icon, size: 18 }),
          h("span", null, a.title)
        ))
      ),
      // Agenda (Heute) — max 3.
      h(AgendaRailMobile, {
        workspace: props.workspace,
        todayModule: props.byId.today,
        engineeringModule: props.byId.engineering,
        load: props.load,
        onMore: props.onGoTimeline
      }),
      // Firma compact.
      h(FirmaPanel, { risel: props.byId.risel, company: props.byId.company, load: props.load, onOpen: props.onGoFirma }),
      // Approvals — compact (max 1 + counter → deep link).
      h(ApprovalCenter, {
        approvals: c.approvals,
        load: props.cockpitLoad,
        compact: true,
        onMore: props.onGoApprovals,
        onOpen: props.onGoApprovals
      })
    );
  }
  function AgendaRailMobile(props) {
    return h("div", { className: "mos__mckpt-agenda" }, h(AgendaRail, { ...props }));
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
    const [approvalsFlash, setApprovalsFlash] = useState(false);
    const approvalsRef = useRef(null);
    const [propose, setPropose] = useState(null);
    const [review, setReview] = useState(null);
    const [coach, setCoach] = useState(null);
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
      },
      [loadOverview, loadCockpit, loadFirma, loadKomm, loadSessions, loadZiele, loadReflexion, loadGesundheit]
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
      };
      window.addEventListener("online", reload);
      window.addEventListener("focus", reload);
      return () => {
        window.removeEventListener("online", reload);
        window.removeEventListener("focus", reload);
      };
    }, [loadOverview, loadCockpit, loadFirma, loadKomm, loadSessions, loadZiele, loadReflexion, loadGesundheit]);
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
    const greeting = useMemo(() => {
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
    const goJarvis = useCallback(() => {
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
    const closeSheet = useCallback(() => {
      setSheetOpen(false);
    }, []);
    const onSpeak = useCallback(() => {
      runStateSequence();
    }, [runStateSequence]);
    const onQuick = useCallback((label) => {
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
      runStateSequence();
      setCommand("");
    }, [runStateSequence]);
    useIdleTimer(
      scene === "cockpit" && stateIndex === 0 && !isMobile,
      9e4,
      useCallback(() => setScene("constellation"), [])
    );
    const onGates = useCallback(() => setScene("approvals"), []);
    const onFirma = useCallback(() => setScene("firma"), []);
    const onApprovals = useCallback(() => setScene("approvals"), []);
    const onSceneBack = useCallback(() => setScene("cockpit"), []);
    const onChip = useCallback((label) => {
      setCommand(label);
      if (inputRef.current) inputRef.current.focus();
    }, []);
    const onAgendaMore = useCallback(() => setScene("timeline"), []);
    const onGoTimeline = useCallback(() => {
      if (isMobile) setMobileTab("timeline");
      else setScene("timeline");
    }, [isMobile]);
    const onGoApprovals = useCallback(() => {
      setMobileScreen("approvals");
    }, []);
    const onGoFirma = useCallback(() => {
      setMobileScreen("firma");
    }, []);
    const onScreenBack = useCallback(() => {
      setMobileScreen(null);
    }, []);
    const onArea = useCallback((id) => {
      if (isMobile) setMobileScreen(id);
      else setScene(id);
    }, [isMobile]);
    const onWissenQuery = useCallback((v) => {
      setWissenQuery(v);
    }, []);
    if (isMobile) {
      return h(
        "div",
        { className: "mos mos--mobile" },
        h("div", { className: "mos__atmosphere", "aria-hidden": "true" }),
        h("div", { className: "mos__atmosphere-veil", "aria-hidden": "true" }),
        h(MobileShell, {
          mobileTab,
          onMobileTab: setMobileTab,
          byId: enrichedById,
          modules: viewModules,
          focusId,
          onOpen: openModule,
          command,
          onCommand: setCommand,
          onSubmit: submit,
          onSpeak,
          onQuick,
          stateIndex,
          workspace,
          onWorkspace: setWorkspace,
          loadState,
          liveCount,
          greeting,
          onGoJarvis: goJarvis,
          announce,
          sheetOpen,
          sheetDetent,
          onSheetDetent: setSheetDetent,
          onSheetClose: closeSheet,
          onPropose: proposeOpen,
          onReview: reviewOpen,
          onCoach: coachOpen,
          cockpit,
          cockpitLoad,
          onChip,
          onGoTimeline,
          onGoApprovals,
          onGoFirma,
          mobileScreen,
          onScreenBack,
          firma,
          firmaLoad,
          approvalDetails,
          approvalDetailLoading,
          onLoadDetail: loadApprovalDetail,
          onArea,
          wissen,
          wissenLoad,
          wissenQuery,
          onWissenQuery,
          onWissenSearch: loadWissen,
          komm,
          kommLoad,
          sessions,
          sessionsLoad,
          ziele,
          zieleLoad,
          reflexion,
          reflexionLoad,
          gesundheit,
          gesundheitLoad
        }),
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
    const commandForm = h(
      "form",
      { className: "mos__command", onSubmit: submit },
      h(
        "div",
        { className: "mos__command-bar" },
        h("button", { type: "button", className: "mos__mic", "aria-label": "Sprachbefehl starten" }, h(Icon, { name: "mic", size: 22 })),
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
    const isBackScene = scene === "firma" || scene === "approvals" || scene === "wissen" || scene === "kommunikation" || scene === "sessions" || scene === "ziele" || scene === "reflexion" || scene === "gesundheit";
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
          React.Fragment,
          null,
          h(KpiBar, { cockpit, load: cockpitLoad, onGates }),
          h(AreaLauncher, { onOpen: onArea }),
          h(
            "div",
            { className: "mos__stagewrap mos__stagewrap--ckpt" },
            h(CockpitScene, {
              byId: enrichedById,
              workspace,
              onWorkspace: setWorkspace,
              cockpit,
              cockpitLoad,
              load: loadState,
              stateIndex,
              greeting,
              onPropose: proposeOpen,
              onChip,
              onAgendaMore,
              approvalsFlash,
              approvalsRef,
              onFirma,
              onApprovals
            })
          )
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
              h("span", null, "mission.v2 + Session-Broker :18087 (inventory) · Steuern/Continue/Steer bleiben gated")
            ),
            h("span", { className: "mos__scenehead-ro" }, h(Icon, { name: "lock", size: 12 }), "Nur lesen")
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
        scene === "cockpit" || isBackScene ? h(
          "footer",
          { className: "mos__ckpt-foot" },
          h(StateRail, { activeIndex: stateIndex }),
          commandForm
        ) : h(React.Fragment, null, commandForm, constFooter)
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
