document.addEventListener('DOMContentLoaded', () => {
    
    // --- GLOBAL SELECTORS ---
    const loader = document.getElementById('loader');
    const bootSequence = document.getElementById('boot-sequence');
    const terminalView = document.getElementById('terminal-view');
    const guiView = document.getElementById('gui-view');
    const terminalButton = document.getElementById('terminal-button');
    const cmdLine = document.getElementById('command-line');
    const windowContainer = document.getElementById('window-container');
    const taskbarTabs = document.getElementById('taskbar-tabs');
    const taskbarClock = document.getElementById('taskbar-clock');
    const desktopIconContainer = document.getElementById('desktop-icon-container');
    const output = document.getElementById('output');
    const fakeInput = document.getElementById('fake-input');
    const promptSymbol = document.querySelector('.prompt-symbol');

    // --- GLOBAL STATE ---
    let appData = {}; // Will be filled by data.json
    let global_ascii_art = ''; // Stores generated ASCII
    let commandHistory = [];
    let historyIndex = 0;
    let highestZ = 100;
    // *** NEW: Check for mobile ***
    const isMobile = window.innerWidth <= 768;
    
    // --- CURSOR LOGIC ---
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorRing = document.querySelector('.cursor-ring');
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    if (!isMobile) {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top = `${mouseY}px`;
        });
        
        animateCursorRing();
    } else {
        // Hide cursors on mobile
        cursorDot.style.display = 'none';
        cursorRing.style.display = 'none';
    }
    
    function animateCursorRing() {
        if (isMobile) return; // Stop animation on mobile
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;
        cursorRing.style.left = `${ringX}px`;
        cursorRing.style.top = `${ringY}px`;
        requestAnimationFrame(animateCursorRing);
    }

    function addCursorEvents() {
        if (isMobile) return; // No cursor events on mobile
        document.querySelectorAll('a, button, .desktop-icon, .title-bar-button, .start-button, .resize-grip, .taskbar-tab, .file-manager-list li, .win-button, .terminal-file, .ttt-cell, .ms-cell, .ms-reset-btn').forEach(el => {
            el.removeEventListener('mouseenter', onCursorEnter);
            el.removeEventListener('mouseleave', onCursorLeave);
            el.addEventListener('mouseenter', onCursorEnter);
            el.addEventListener('mouseleave', onCursorLeave);
        });
    }
    function onCursorEnter() {
        cursorDot.classList.add('expand');
        cursorRing.classList.add('expand');
    }
    function onCursorLeave() {
        cursorDot.classList.remove('expand');
        cursorRing.classList.remove('expand');
    }
    
    // --- TASKBAR CLOCK ---
    function updateClock() {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (taskbarClock) taskbarClock.textContent = time;
    }

    // --- VIEW TOGGLE LOGIC ---
    function switchToGui() {
        if (isMobile) {
            printToOutput("GUI mode is only available on desktop.");
            return;
        }
        terminalView.classList.add('hidden');
        guiView.classList.remove('hidden');
        addCursorEvents(); 
    }
    function switchToTerminal() {
        guiView.classList.add('hidden');
        terminalView.classList.remove('hidden');
        cmdLine.focus();
    }
    
    // --- TERMINAL LOGIC ---
    const bootLines = [
        "FUAD.AI System Kernel v3.0 initializing...",
        "Checking system memory... OK.",
        "[ok] Loading driver: python3_kernel.sys",
        "[ok] Loading driver: ai_ml_core.drv",
        "[ok] Loading driver: cloud_api.dll",
        "[ok] Loading driver: php_fpm.sys",
        "Initializing virtual network... Established.",
        "Fetching user profile... Done.",
        "SYSTEM READY.",
        "",
        "<span style='color: #8be9fd;'>&lt;script&gt;</span>",
        "  <span style='color: #ff79c6;'>while</span>(<span style='color: #bd93f9;'>true</span>) {",
        "    <span style='color: #50fa7b;'>develop</span>();",
        "    <span style='color: #50fa7b;'>innovate</span>();",
        "    <span style='color: #50fa7b;'>create</span>();",
        "  }",
        "<span style='color: #8be9fd;'>&lt;/script&gt;</span>"
    ];
    
    let bootLineIndex = 0;
    function runBootSequence() {
        if (bootLineIndex < bootLines.length) {
            const line = document.createElement('p');
            line.innerHTML = bootLines[bootLineIndex];
            line.style.animationDelay = `${bootLineIndex * 0.1}s`;
            bootSequence.appendChild(line);
            bootSequence.scrollTop = bootSequence.scrollHeight;
            bootLineIndex++;
            setTimeout(runBootSequence, Math.random() * 80 + 40);
        } else {
            setTimeout(() => {
                loader.style.opacity = 0;
                loader.style.visibility = "hidden";
                
                // *** FIX: Print welcome message to TERMINAL, not loader ***
                printToOutput("**************************************************");
                printToOutput("Welcome. Type 'help' to see available commands.");
                printToOutput("**************************************************");
                
                cmdLine.focus();
                
                // *** FIX: THE FUNCTION CALL IS NOW HERE ***
                loadAsciiFromTxt('profile-ascii.txt');
            }, 500);
        }
    }

    // Terminal Event Listeners
    terminalView.addEventListener('click', (e) => {
        // Event delegation for clickable files
        if (e.target.classList.contains('terminal-file')) {
            const command = e.target.dataset.command;
            if (command) {
                printToOutput(`<span class="prompt-symbol">${promptSymbol.textContent}</span> ${command}`); // Simulate typing
                parseCommand(command);
                terminalView.scrollTop = terminalView.scrollHeight; // Scroll down
            }
        }
        else if (window.getSelection().type !== 'Range') {
           cmdLine.focus();
        }
    });
    
    cmdLine.addEventListener('input', () => {
        fakeInput.textContent = cmdLine.value;
    });
    cmdLine.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const command = cmdLine.value.trim().toLowerCase();
            printToOutput(`<span class="prompt-symbol">${promptSymbol.textContent}</span> ${cmdLine.value}`);
            if (command) {
                commandHistory.push(command);
                historyIndex = commandHistory.length;
                parseCommand(command);
            }
            cmdLine.value = '';
            fakeInput.textContent = '';
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                cmdLine.value = commandHistory[historyIndex];
                fakeInput.textContent = cmdLine.value;
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                cmdLine.value = commandHistory[historyIndex];
                fakeInput.textContent = cmdLine.value;
            } else {
                historyIndex = commandHistory.length;
                cmdLine.value = '';
                fakeInput.textContent = '';
            }
        }
    });

    // Terminal Command Parser
    function parseCommand(command) {
        // Check terminal-only commands first
        const termCmd = appData.terminalCommands.find(c => c.command === command);
        if (termCmd) {
            switch (command) {
                case 'help': printHelp(); break;
                case 'gui':
                    if (isMobile) {
                        printToOutput("GUI mode is only available on desktop.");
                    } else {
                        printToOutput("Loading Graphical User Interface...");
                        setTimeout(switchToGui, 500);
                    }
                    break;
                case 'ls': printLs(); break;
                case 'clear': output.innerHTML = ''; break;
                case 'reboot':
                    output.innerHTML = '';
                    switchToTerminal();
                    loader.style.opacity = 1;
                    loader.style.visibility = "visible";
                    bootSequence.innerHTML = '';
                    bootLineIndex = 0;
                    runBootSequence();
                    break;
            }
            terminalView.scrollTop = terminalView.scrollHeight;
            return;
        }
        
        // Check app commands
        const appCmd = appData.apps.find(a => a.command === command || (a.aliases && a.aliases.includes(command)));
        if (appCmd) {
            printTerminalContent(appCmd);
            terminalView.scrollTop = terminalView.scrollHeight;
            return;
        }

        printToOutput(`'${command}': command not recognized. Type 'help' for assistance.`);
        terminalView.scrollTop = terminalView.scrollHeight;
    }

    // --- TERMINAL COMMAND OUTPUTS ---
    function printToOutput(html) {
        const p = document.createElement('p');
        p.innerHTML = html;
        output.appendChild(p);
        addCursorEvents(); // Re-apply events for new elements
    }

    function printHelp() {
        let helpText = "<pre>  FUAD.AI Command Help\n\n";
        // Add app commands
        appData.apps.forEach(app => {
            if (app.command) {
                let aliases = (app.aliases && app.aliases.length > 0) ? ` (aliases: ${app.aliases.join(', ')})` : '';
                helpText += `  <b>${app.command}</b>${aliases}\n`;
            }
        });
        // Add terminal-only commands
        appData.terminalCommands.forEach(cmd => {
            helpText += `  <b>${cmd.command}</b>\n`;
        });
        helpText += "</pre>";
        printToOutput(helpText);
    }
    
    function printLs() {
        let lsText = "<pre>  Volume F: \\ Users \\ Fuad\n\n";
        appData.apps.forEach(app => {
            // Make clickable if it has a command
            if (app.command) {
                lsText += `  <span class="terminal-file" data-command="${app.command}" title="Run '${app.command}'">${app.label}</span>\n`;
            } else {
                // Not clickable if it's GUI only (like My Computer)
                lsText += `  ${app.label}\n`;
            }
        });
        lsText += "</pre>";
        printToOutput(lsText);
    }
    
    // This function dynamically builds terminal output based on app type
    function printTerminalContent(app) {
        switch(app.content.type) {
            case 'profile':
                const art_to_display = global_ascii_art 
                    ? `<pre class="ascii-art">${global_ascii_art}</pre>` 
                    : `<pre class="ascii-art" style="color: #ff5555;">${appData.asciiError}</pre>`;
                
                printToOutput(`
                    <h2>${app.content.title}</h2>
                    ${art_to_display}
                    <p><b>${app.content.subtitle}</b></p>
                    <p>${app.content.body}</p>
                `);
                break;
            
            case 'html':
                printToOutput(app.content.html);
                break;
            
            case 'game-tictactoe':
            case 'game-minesweeper':
                if (isMobile) {
                    printToOutput("Games are only playable in the GUI on a desktop.");
                } else {
                    printToOutput(`Launching ${app.windowTitle}... Please switch to the GUI by typing 'gui'.`);
                    createWindow(app.id); // Also launch it
                }
                break;
                
            case 'socials':
                let socialLinks = `<h2>${app.windowTitle}</h2><pre>`;
                app.content.links.forEach(link => {
                    socialLinks += `  <b>${link.name}</b>     <a href="${link.url}" target="_blank">${link.url}</a>\n`;
                });
                socialLinks += "</pre>";
                printToOutput(socialLinks);
                break;
                
            default:
                printToOutput(app.content.html || `Command '${app.command}' has no terminal output defined.`);
        }
    }
    
    // --- WIN98 GUI LOGIC ---
    
    // 1. Generate Desktop Icons
    function generateDesktopIcons() {
        if (isMobile) return; // Don't generate icons on mobile

        let iconTop = 20;
        let iconLeft = 20;
        let iconCount = 0;
        
        appData.apps.forEach(app => {
            const icon = document.createElement('div');
            icon.className = 'desktop-icon';
            icon.id = `icon-${app.id}`;
            icon.dataset.windowId = app.id;
            
            icon.innerHTML = `
                <i class="${app.icon}"></i>
                <span class="icon-label">${app.label}</span>
            `;
            
            // Basic grid layout
            icon.style.top = `${iconTop}px`;
            icon.style.left = `${iconLeft}px`;
            
            iconCount++;
            iconTop += 100; // Move to next row
            if (iconCount % 5 === 0) { // Wrap to next column
                iconTop = 20;
                iconLeft += 100;
            }
            
            desktopIconContainer.appendChild(icon);
            
            // Add Listeners
            icon.addEventListener('dblclick', () => {
                createWindow(app.id);
            });
            icon.addEventListener('click', () => {
                document.querySelectorAll('.desktop-icon.selected').forEach(selected => selected.classList.remove('selected'));
                icon.classList.add('selected');
            });
            
            dragElement(icon); // Make it draggable
        });
        
        addCursorEvents();
    }
    
    // 2. Deselect Icons
    guiView.addEventListener('click', (e) => {
        if (e.target === guiView) {
             document.querySelectorAll('.desktop-icon.selected').forEach(selected => selected.classList.remove('selected'));
        }
    });

    // 3. Create Window Function
    function createWindow(windowId) {
        if (isMobile) return; // Don't create windows on mobile

        const windowElId = `window-${windowId}`;
        const tabElId = `tab-${windowId}`;
        
        const existingWindow = document.getElementById(windowElId);
        if (existingWindow) {
            if (existingWindow.classList.contains('minimized')) {
                restoreWindow(existingWindow, document.getElementById(tabElId));
            }
            existingWindow.style.zIndex = ++highestZ;
            return existingWindow;
        }
        
        const app = appData.apps.find(a => a.id === windowId);
        if (!app) return;
        
        // Build window content
        let contentHtml = '';
        switch (app.content.type) {
            case 'profile':
                contentHtml = `
                    <img id="profile-img-gui" src="${app.content.image}" alt="${app.content.title}" onerror="this.style.display='none'">
                    <h3>${app.content.title}</h3>
                    <p><b>${app.content.subtitle}</b></p>
                    <p>${app.content.body}</p>
                `;
                break;
            case 'fileManager':
                contentHtml = '<h3>F: \\ Users \\ Fuad</h3><ul class="file-manager-list">';
                appData.apps.forEach(fileApp => {
                    contentHtml += `<li data-open-window="${fileApp.id}" title="Double-click to open"><i class="${fileApp.icon}"></i>${fileApp.label}</li>`;
                });
                contentHtml += '</ul>';
                break;
            case 'socials':
                contentHtml = `<h3>Get In Touch</h3><p>Let's build something amazing together. Links will open in a new tab.</p><ul class="social-list">`;
                app.content.links.forEach(link => {
                    contentHtml += `<li><a href="${link.url}" target="_blank"><i class="${link.icon}"></i> ${link.name}</a></li>`;
                });
                contentHtml += '</ul>';
                break;
            case 'game-tictactoe':
                contentHtml = `
                    <div class="ttt-container">
                        <div class="ttt-status">Your Turn (X)</div>
                        <div class="ttt-board">
                            ${Array(9).fill(0).map((_, i) => `<div class="ttt-cell" data-index="${i}"></div>`).join('')}
                        </div>
                        <button class="win-button ttt-reset-btn">Reset Game</button>
                    </div>
                `;
                break;
            case 'game-minesweeper':
                contentHtml = `
                    <div class="ms-container">
                        <div class="ms-header">
                            <div class="ms-stats" id="ms-mine-count">10</div>
                            <button class="ms-reset-btn">🙂</button>
                            <div class="ms-stats" id="ms-timer">000</div>
                        </div>
                        <div class="ms-grid">
                            </div>
                    </div>
                `;
                break;
            case 'html':
                contentHtml = app.content.html;
                break;
        }

        const newWindow = document.createElement('div');
        newWindow.className = 'window';
        newWindow.id = windowElId;
        newWindow.style.zIndex = ++highestZ;
        newWindow.style.top = `${Math.random() * 50 + 40}px`;
        newWindow.style.left = `${Math.random() * 150 + 150}px`;
        
        // Make Games non-resizable
        if (app.content.type.startsWith('game-')) {
            newWindow.style.width = 'auto'; // Fit content
            newWindow.style.height = 'auto';
            newWindow.style.minWidth = '0px';
            newWindow.style.minHeight = '0px';
        }
        
        newWindow.innerHTML = `
            <div class="window-title-bar">
                <span class="title-bar-text">${app.windowTitle}</span>
                <div class="title-bar-buttons">
                    <button class="title-bar-button minimize-button" aria-label="Minimize">_</button>
                    <button class="title-bar-button maximize-button" aria-label="Maximize">◻</button>
                    <button class="title-bar-button close-button" aria-label="Close">X</button>
                </div>
            </div>
            <div class="window-body win-content">
                ${contentHtml}
            </div>
            <div class="resize-grip"></div>
        `;
        
        windowContainer.appendChild(newWindow);
        const taskbarTab = createTaskbarTab(newWindow, app.windowTitle, tabElId);
        
        // Add Functionality
        dragElement(newWindow);
        if (!app.content.type.startsWith('game-')) {
            resizeElement(newWindow); // Only allow resize if not game
        } else {
            newWindow.querySelector('.resize-grip').style.display = 'none'; // Hide grip
        }
        
        newWindow.querySelector('.close-button').addEventListener('click', () => {
            newWindow.remove();
            taskbarTab.remove();
        });
        
        newWindow.querySelector('.minimize-button').addEventListener('click', () => {
            minimizeWindow(newWindow, taskbarTab);
        });
        
        newWindow.querySelector('.maximize-button').addEventListener('click', (e) => {
             if (!app.content.type.startsWith('game-')) { // Don't maximize games
                maximizeWindow(newWindow, e.currentTarget);
             }
        });
        
        newWindow.addEventListener('mousedown', () => {
            newWindow.style.zIndex = ++highestZ;
            document.querySelectorAll('.taskbar-tab').forEach(t => t.classList.remove('active'));
            taskbarTab.classList.add('active');
        });
        
        // Add File Manager functionality
        if (windowId === 'computer') {
            newWindow.querySelectorAll('.file-manager-list li').forEach(li => {
                li.addEventListener('dblclick', (e) => {
                    const openWindowId = e.currentTarget.dataset.openWindow;
                    createWindow(openWindowId);
                });
            });
        }
        
        // Initialize game logic if it's a game window
        if (windowId === 'tictactoe') {
            initTicTacToeGame(newWindow);
        }
        if (windowId === 'minesweeper') {
            initMinesweeperGame(newWindow);
        }
        
        addCursorEvents();
        return newWindow;
    }
    
    // 4. Window Functions (Minimize, Maximize, etc.)
    function createTaskbarTab(windowEl, title, tabElId) {
        const tab = document.createElement('button');
        tab.className = 'taskbar-tab active';
        tab.id = tabElId;
        tab.textContent = title;
        
        document.querySelectorAll('.taskbar-tab').forEach(t => t.classList.remove('active'));
        taskbarTabs.appendChild(tab);
        
        tab.addEventListener('click', () => {
            if (windowEl.classList.contains('minimized')) {
                restoreWindow(windowEl, tab);
            } else {
                if (windowEl.style.zIndex == highestZ - 1) { // Check if it's already active
                    minimizeWindow(windowEl, tab);
                } else {
                    windowEl.style.zIndex = ++highestZ;
                    document.querySelectorAll('.taskbar-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                }
            }
        });
        addCursorEvents();
        return tab;
    }
    
    function minimizeWindow(windowEl, tabEl) {
        windowEl.classList.add('minimized');
        tabEl.classList.remove('active');
    }
    
    function restoreWindow(windowEl, tabEl) {
        windowEl.classList.remove('minimized');
        document.querySelectorAll('.taskbar-tab').forEach(t => t.classList.remove('active'));
        tabEl.classList.add('active');
        windowEl.style.zIndex = ++highestZ;
    }
    
    function maximizeWindow(windowEl, maxButton) {
        if (windowEl.classList.contains('maximized')) {
            // Restore
            windowEl.classList.remove('maximized');
            windowEl.style.top = windowEl.dataset.oldTop;
            windowEl.style.left = windowEl.dataset.oldLeft;
            windowEl.style.width = windowEl.dataset.oldWidth;
            windowEl.style.height = windowEl.dataset.oldHeight;
            maxButton.textContent = '◻';
        } else {
            // Maximize
            windowEl.dataset.oldTop = windowEl.style.top;
            windowEl.dataset.oldLeft = windowEl.style.left;
            windowEl.dataset.oldWidth = `${windowEl.offsetWidth}px`;
            windowEl.dataset.oldHeight = `${windowEl.offsetHeight}px`;
            
            windowEl.classList.add('maximized');
            maxButton.textContent = '❐'; // Restore icon
        }
    }
    
    // 5. Drag & Resize Functions
    function dragElement(elmnt) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        const titleBar = elmnt.querySelector(".window-title-bar");
        const dragHandle = titleBar || elmnt;
        
        dragHandle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.zIndex = ++highestZ;
            
            if (elmnt.id.startsWith('window-')) {
                 document.querySelectorAll('.taskbar-tab').forEach(t => t.classList.remove('active'));
                 const tabId = `tab-${elmnt.id.split('-')[1]}`;
                 const tab = document.getElementById(tabId);
                 if (tab) tab.classList.add('active');
            }
            
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            
            if (elmnt.classList.contains('maximized')) return;
            
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            let newTop = elmnt.offsetTop - pos2;
            let newLeft = elmnt.offsetLeft - pos1;
            
            const desktop = guiView;
            if (newTop < 0) newTop = 0;
            if (newLeft < 0) newLeft = 0;
            if (newTop + elmnt.offsetHeight > desktop.clientHeight) newTop = desktop.clientHeight - elmnt.offsetHeight;
            if (newLeft + elmnt.offsetWidth > desktop.clientWidth) newLeft = desktop.clientWidth - elmnt.offsetWidth;
            
            elmnt.style.top = newTop + "px";
            elmnt.style.left = newLeft + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
    
    function resizeElement(elmnt) {
        const resizeGrip = elmnt.querySelector('.resize-grip');
        
        // *** THIS IS THE FIX ***
        // It was 'resizeGGrip' before. Now it's 'resizeGrip'.
        if (!resizeGrip) return; 
        
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        resizeGrip.onmousedown = resizeMouseDown;
        
        function resizeMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            e.stopPropagation();
            
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            document.onmouseup = closeResizeElement;
            document.onmousemove = elementResize;
        }
        
        function elementResize(e) {
            e = e || window.event;
            e.preventDefault();
            
            if (elmnt.classList.contains('maximized')) return;
            
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            let newWidth = elmnt.offsetWidth - pos1;
            let newHeight = elmnt.offsetHeight - pos2;
            
            const minWidth = parseInt(elmnt.style.minWidth) || 300;
            const minHeight = parseInt(elmnt.style.minHeight) || 200;

            if (newWidth > minWidth) elmnt.style.width = newWidth + "px";
            if (newHeight > minHeight) elmnt.style.height = newHeight + "px";
        }
        
        function closeResizeElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
    
    // 6. ASCII Art Loader
    function loadAsciiFromTxt(url) {
        const fullPath = new URL(url, window.location.href).href;
        
        fetch(url)
            .then(response => {
                if (response.ok) {
                    return response.text();
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            })
            .then(text => {
                global_ascii_art = text; // Save the loaded art
            })
            .catch(error => {
                console.error('Failed to fetch ASCII art:', error);
                appData.asciiError = `ERROR: Could not load '${url}'.\nFull path checked: ${fullPath}\n\nMake sure the file is in the same folder as index.html and you are running this on a local server.`;
            });
    }
    
    // 7. TIC-TAC-TOE GAME LOGIC
    function initTicTacToeGame(windowEl) {
        const statusEl = windowEl.querySelector('.ttt-status');
        const cells = windowEl.querySelectorAll('.ttt-cell');
        const resetBtn = windowEl.querySelector('.ttt-reset-btn');
        
        let currentPlayer = 'X'; // X is Player
        let boardState = ['', '', '', '', '', '', '', '', ''];
        let gameActive = true;
        
        const winningConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]  // Diagonals
        ];
        
        function handleCellClick(e) {
            const cell = e.currentTarget;
            const index = parseInt(cell.dataset.index);
            
            if (boardState[index] !== '' || !gameActive || currentPlayer === 'O') {
                return;
            }
            
            // Player's move
            boardState[index] = currentPlayer;
            cell.textContent = currentPlayer;
            cell.classList.add(currentPlayer.toLowerCase());
            
            if (checkWin()) {
                statusEl.textContent = `Player (X) has won!`;
                gameActive = false;
                highlightWin(winningLine);
                return;
            }
            
            if (isDraw()) {
                statusEl.textContent = "Game is a draw!";
                gameActive = false;
                return;
            }
            
            // Switch to AI
            switchPlayer();
            
            // AI makes a move after a short delay
            setTimeout(aiMove, 500);
        }
        
        let winningLine = [];
        function checkWin() {
            let roundWon = false;
            winningLine = [];
            for (let i = 0; i < winningConditions.length; i++) {
                const [a, b, c] = winningConditions[i];
                if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
                    roundWon = true;
                    winningLine = [a, b, c]; // Store the winning line
                    break;
                }
            }
            return roundWon;
        }
        
        function isDraw() {
            return !boardState.includes('');
        }
        
        function highlightWin(line) {
            line.forEach(index => {
                cells[index].classList.add('winner');
            });
        }
        
        function switchPlayer() {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            statusEl.textContent = (currentPlayer === 'X') ? "Your Turn (X)" : "AI's Turn (O)...";
        }
        
        function resetGame() {
            boardState = ['', '', '', '', '', '', '', '', ''];
            gameActive = true;
            currentPlayer = 'X';
            statusEl.textContent = `Your Turn (X)`;
            cells.forEach(cell => {
                cell.textContent = '';
                cell.classList.remove('x', 'o', 'winner');
            });
        }
        
        function aiMove() {
            if (!gameActive) return;
            
            // --- AI Logic (Minimax-based) ---
            let bestMove = -1;
            let bestScore = -Infinity;
            
            for(let i = 0; i < 9; i++) {
                if (boardState[i] === '') {
                    boardState[i] = 'O';
                    let score = minimax(boardState, 0, false);
                    boardState[i] = '';
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = i;
                    }
                }
            }
            
            // --- Make the move ---
            if (bestMove !== -1) {
                boardState[bestMove] = 'O';
                cells[bestMove].textContent = 'O';
                cells[bestMove].classList.add('o');
                
                if (checkWin()) {
                    statusEl.textContent = `AI (O) has won!`;
                    gameActive = false;
                    highlightWin(winningLine);
                    return;
                }
                
                if (isDraw()) {
                    statusEl.textContent = "Game is a draw!";
                    gameActive = false;
                    return;
                }
            }
            
            switchPlayer();
        }
        
        const scores = { 'X': -10, 'O': 10, 'tie': 0 };

        function minimax(board, depth, isMaximizing) {
            if (checkWin()) {
                // The winner is the *previous* player
                return isMaximizing ? scores['X'] : scores['O'];
            }
            if (isDraw()) {
                return scores['tie'];
            }

            if (isMaximizing) { // AI's turn (O)
                let bestScore = -Infinity;
                for (let i = 0; i < 9; i++) {
                    if (board[i] === '') {
                        board[i] = 'O';
                        let score = minimax(board, depth + 1, false);
                        board[i] = '';
                        bestScore = Math.max(score, bestScore);
                    }
                }
                return bestScore;
            } else { // Player's turn (X)
                let bestScore = Infinity;
                for (let i = 0; i < 9; i++) {
                    if (board[i] === '') {
                        board[i] = 'X';
                        let score = minimax(board, depth + 1, true);
                        board[i] = '';
                        bestScore = Math.min(score, bestScore);
                    }
                }
                return bestScore;
            }
        }
        
        // Add event listeners
        cells.forEach(cell => cell.addEventListener('click', handleCellClick));
        resetBtn.addEventListener('click', resetGame);
        addCursorEvents(); // Apply cursor to new game buttons/cells
    }
    
    // 8. *** NEW: MINESWEEPER GAME LOGIC ***
    function initMinesweeperGame(windowEl) {
        const GRID_SIZE = 9;
        const NUM_MINES = 10;

        const gridEl = windowEl.querySelector('.ms-grid');
        const mineCountEl = windowEl.querySelector('#ms-mine-count');
        const resetBtn = windowEl.querySelector('.ms-reset-btn');
        
        let board = [];
        let gameActive = true;
        let minesLeft = NUM_MINES;
        let firstClick = true;

        function createBoard() {
            board = [];
            gridEl.innerHTML = ''; // Clear old grid
            gameActive = true;
            firstClick = true;
            minesLeft = NUM_MINES;
            mineCountEl.textContent = String(minesLeft).padStart(3, '0');
            resetBtn.textContent = '🙂';

            for (let r = 0; r < GRID_SIZE; r++) {
                let row = [];
                for (let c = 0; c < GRID_SIZE; c++) {
                    row.push({
                        isMine: false,
                        neighbors: 0,
                        isRevealed: false,
                        isFlagged: false
                    });
                    
                    const cellEl = document.createElement('div');
                    cellEl.className = 'ms-cell hidden';
                    cellEl.dataset.r = r;
                    cellEl.dataset.c = c;
                    
                    cellEl.addEventListener('click', () => handleCellClick(cellEl, r, c));
                    cellEl.addEventListener('contextmenu', (e) => handleCellRightClick(e, cellEl, r, c));
                    
                    gridEl.appendChild(cellEl);
                }
                board.push(row);
            }
            addCursorEvents();
        }

        function placeMines(firstR, firstC) {
            let minesPlaced = 0;
            while (minesPlaced < NUM_MINES) {
                const r = Math.floor(Math.random() * GRID_SIZE);
                const c = Math.floor(Math.random() * GRID_SIZE);
                
                // Don't place on first click or if already a mine
                if (r === firstR && c === firstC) continue;
                if (board[r][c].isMine) continue;
                
                board[r][c].isMine = true;
                minesPlaced++;
            }
            calculateNeighbors();
        }

        function calculateNeighbors() {
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    if (board[r][c].isMine) continue;
                    
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const nr = r + dr;
                            const nc = c + dc;
                            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && board[nr][nc].isMine) {
                                count++;
                            }
                        }
                    }
                    board[r][c].neighbors = count;
                }
            }
        }

        function handleCellClick(cellEl, r, c) {
            if (!gameActive || board[r][c].isRevealed || board[r][c].isFlagged) return;
            
            if (firstClick) {
                placeMines(r, c);
                firstClick = false;
            }
            
            const cellData = board[r][c];
            if (cellData.isMine) {
                gameOver(false, cellEl);
            } else {
                revealCell(r, c);
                checkWin();
            }
        }

        function handleCellRightClick(e, cellEl, r, c) {
            e.preventDefault();
            if (!gameActive || board[r][c].isRevealed) return;
            
            board[r][c].isFlagged = !board[r][c].isFlagged;
            if (board[r][c].isFlagged) {
                cellEl.innerHTML = '<i class="fas fa-flag"></i>';
                minesLeft--;
            } else {
                cellEl.innerHTML = '';
                minesLeft++;
            }
            mineCountEl.textContent = String(minesLeft).padStart(3, '0');
            checkWin();
        }

        function revealCell(r, c) {
            if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return; // Out of bounds
            
            const cellData = board[r][c];
            if (cellData.isRevealed || cellData.isFlagged || cellData.isMine) return;
            
            cellData.isRevealed = true;
            const cellEl = gridEl.children[r * GRID_SIZE + c];
            cellEl.classList.remove('hidden');
            cellEl.classList.add('revealed');
            
            if (cellData.neighbors > 0) {
                cellEl.textContent = cellData.neighbors;
                cellEl.dataset.mines = cellData.neighbors;
            } else {
                // Flood fill
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        revealCell(r + dr, c + dc);
                    }
                }
            }
        }

        function checkWin() {
            let revealedCount = 0;
            let flaggedMines = 0;
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    if (board[r][c].isRevealed) revealedCount++;
                    if (board[r][c].isMine && board[r][c].isFlagged) flaggedMines++;
                }
            }
            
            if (flaggedMines === NUM_MINES || revealedCount === (GRID_SIZE * GRID_SIZE) - NUM_MINES) {
                gameOver(true);
            }
        }

        function gameOver(isWin, clickedMineEl) {
            gameActive = false;
            if (isWin) {
                resetBtn.textContent = '😎';
                mineCountEl.textContent = '000';
            } else {
                resetBtn.textContent = '😵';
                // Reveal all mines
                for (let r = 0; r < GRID_SIZE; r++) {
                    for (let c = 0; c < GRID_SIZE; c++) {
                        if (board[r][c].isMine) {
                            const cellEl = gridEl.children[r * GRID_SIZE + c];
                            cellEl.classList.remove('hidden');
                            cellEl.innerHTML = '<i class="fas fa-bomb"></i>';
                        }
                    }
                }
                if (clickedMineEl) {
                    clickedMineEl.style.background = 'red';
                }
            }
        }
        
        // Add reset listener
        resetBtn.addEventListener('click', createBoard);
        
        // Initial setup
        createBoard();
    }


    // --- INITIALIZATION ---
    async function main() {
        // Load data from JSON
        try {
            const response = await fetch(`data.json?v=${new Date().getTime()}`);
            if (!response.ok) {
                 throw new Error(`HTTP error! status: ${response.status}`);
            }
            appData = await response.json();
        } catch (error) {
            console.error('Failed to load data.json. App cannot start.', error);
            bootSequence.innerHTML = `<p style="color: red; opacity: 1;">FATAL ERROR: Could not load data.json. Check file name and console.</p>`;
            return;
        }
        
        // Start cursor
        if (!isMobile) animateCursorRing();
        
        // Start clock
        updateClock();
        setInterval(updateClock, 1000);

        // Start boot sequence
        runBootSequence();
        
        // Set up GUI (only if not mobile)
        if (!isMobile) {
            generateDesktopIcons();
            terminalButton.addEventListener('click', switchToTerminal);
        }
        
        // Pre-apply cursor events
        addCursorEvents();
    }

    main(); // Run the app
});