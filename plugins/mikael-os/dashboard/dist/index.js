var MikaelOSPlugin = function() {
  "use strict";
  const ICONS = {
    "sparkles": '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /> <path d="M20 3v4" /> <path d="M22 5h-4" /> <path d="M4 17v2" /> <path d="M5 18H3" />',
    "orbit": '<circle cx="12" cy="12" r="3" /> <circle cx="19" cy="5" r="2" /> <circle cx="5" cy="19" r="2" /> <path d="M10.4 21.9a10 10 0 0 0 9.941-15.416" /> <path d="M13.5 2.1a10 10 0 0 0-9.841 15.416" />',
    "sun": '<circle cx="12" cy="12" r="4" /> <path d="M12 2v2" /> <path d="M12 20v2" /> <path d="m4.93 4.93 1.41 1.41" /> <path d="m17.66 17.66 1.41 1.41" /> <path d="M2 12h2" /> <path d="M20 12h2" /> <path d="m6.34 17.66-1.41 1.41" /> <path d="m19.07 4.93-1.41 1.41" />',
    "calendar-days": '<path d="M8 2v4" /> <path d="M16 2v4" /> <rect width="18" height="18" x="3" y="4" rx="2" /> <path d="M3 10h18" /> <path d="M8 14h.01" /> <path d="M12 14h.01" /> <path d="M16 14h.01" /> <path d="M8 18h.01" /> <path d="M12 18h.01" /> <path d="M16 18h.01" />',
    "circle-check-big": '<path d="M21.801 10A10 10 0 1 1 17 3.335" /> <path d="m9 11 3 3L22 4" />',
    "target": '<circle cx="12" cy="12" r="10" /> <circle cx="12" cy="12" r="6" /> <circle cx="12" cy="12" r="2" />',
    "flame": '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />',
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
    "party-popper": '<path d="M5.8 11.3 2 22l10.7-3.79" /> <path d="M4 3h.01" /> <path d="M22 8h.01" /> <path d="M15 2h.01" /> <path d="M22 20h.01" /> <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" /> <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" /> <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" /> <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" />'
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
    { id: "listening", icon: "ear", label: "Hört zu", tone: "ready" },
    { id: "thinking", icon: "brain", label: "Denkt", tone: "ready" },
    { id: "suggest", icon: "lightbulb", label: "Vorschlag", tone: "amber" },
    { id: "executing", icon: "zap", label: "Ausführung", tone: "amber" },
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
  function MobileHeute() {
    return h(
      "section",
      { className: "mos__mheute", "aria-label": "Jetzt wichtig" },
      h(
        "div",
        { className: "mos__mheute-head" },
        h("h2", null, "Jetzt wichtig"),
        h("span", { className: "mos__pip mos__pip--konzept" }, h(Icon, { name: "flask-conical", size: 11 }), "Konzept")
      ),
      h(
        "div",
        { className: "mos__mheute-cols" },
        h(
          "div",
          { className: "mos__mheute-col" },
          h("span", { className: "mos__mheute-k" }, h(Icon, { name: "clock", size: 13 }), "Nächster Termin"),
          h("span", { className: "mos__mheute-v" }, "10:30 · Team Sync"),
          h("span", { className: "mos__mheute-sub" }, h(Icon, { name: "map", size: 12 }), "Q4 Roadmap · Virtuell")
        ),
        h(
          "div",
          { className: "mos__mheute-col" },
          h("span", { className: "mos__mheute-k" }, h(Icon, { name: "target", size: 13 }), "Fokus"),
          h("span", { className: "mos__mheute-v" }, "Engineering Deep Work"),
          h("span", { className: "mos__mheute-sub" }, h(Icon, { name: "clock", size: 12 }), "bis 12:00")
        )
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
      h(MobileHeute, null),
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
  function MobileShell(props) {
    const tab = props.mobileTab;
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
        onGoJarvis: props.onGoJarvis
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
      { className: "mos__scenes", role: "group", "aria-label": "Ansicht wechseln" },
      [{ id: "constellation", icon: "orbit", label: "Konstellation" }, { id: "timeline", icon: "waypoints", label: "Timeline" }].map((s) => h(
        "button",
        { key: s.id, type: "button", className: "mos__scene-tab", "aria-pressed": props.scene === s.id ? "true" : "false", onClick: () => props.onScene(s.id) },
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
        h(SceneSwitcher, { scene: props.scene, onScene: props.onScene }),
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
        h(
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
  function MikaelOS() {
    const [workspace, setWorkspace] = useState("private");
    const [modules, setModules] = useState(MODULES);
    const [focusId, setFocusId] = useState("engineering");
    const [stateIndex, setStateIndex] = useState(0);
    const [command, setCommand] = useState("");
    const [scene, setScene] = useState("constellation");
    const isMobile = useMediaQuery("(max-width: 430px)");
    const [mobileTab, setMobileTab] = useState("home");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetDetent, setSheetDetent] = useState(1);
    const [live, setLive] = useState(null);
    const [loadState, setLoadState] = useState("loading");
    const [propose, setPropose] = useState(null);
    const [review, setReview] = useState(null);
    const [coach, setCoach] = useState(null);
    useEffect(() => {
      let alive = true;
      const sdk = typeof window !== "undefined" && window.__HERMES_PLUGIN_SDK__ || {};
      const getJSON = sdk.fetchJSON ? (u) => sdk.fetchJSON(u) : typeof fetch === "function" ? (u) => fetch(u).then((r) => r.ok ? r.json() : Promise.reject(r.status)) : null;
      if (!getJSON) {
        setLoadState("offline");
        return;
      }
      Promise.resolve().then(() => getJSON(PLUGIN_API + "/overview")).then((data) => {
        if (alive) {
          setLive(data);
          setLoadState("ready");
        }
      }).catch(() => {
        if (alive) setLoadState("offline");
      });
      return () => {
        alive = false;
      };
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
      const steps = [1, 2, 3, 4, 5];
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
          onCoach: coachOpen
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
    return h(
      "div",
      { className: "mos" + (scene === "timeline" ? " mos--timeline" : "") },
      h("div", { className: "mos__atmosphere", "aria-hidden": "true" }),
      h("div", { className: "mos__atmosphere-veil", "aria-hidden": "true" }),
      h(LiveAnnouncer, { message: announce }),
      h(
        "main",
        { className: "mos__shell", role: "main" },
        h("h1", { className: "mos__sr-only" }, "MIKAEL OS — Persönliches System"),
        h(TopBar, { loadState, liveCount, total: viewModules.length, scene, onScene: setScene }),
        scene === "timeline" ? h(
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
        // command bar + chips
        h(
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
            // The propose chip is the entry to the ONE gated action. It opens the
            // dry-run preview overlay (fires nothing); every other chip just
            // pre-fills the command box.
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
        ),
        // footer: quick access · state rail · reorder hint
        h(
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
        )
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
