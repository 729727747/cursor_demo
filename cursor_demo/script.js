document.addEventListener('DOMContentLoaded', function() {
    const addContactBtn = document.querySelector('.add-contact');
    const contactsList = document.querySelector('.contacts');
    const messagesArea = document.querySelector('.messages');
    const messageInput = document.querySelector('.input-area textarea');
    const sendButton = document.querySelector('.send-btn');

    // 在DOMContentLoaded事件处理函数开始处添加聊天记录存储
    const chatHistory = new Map(JSON.parse(localStorage.getItem('chatHistory') || '[]'));

    // 在DOMContentLoaded事件处理函数开始处添加用户头像变量
    const DEFAULT_USER_AVATAR = 'https://cdn-icons-png.flaticon.com/512/1077/1077063.png';
    let currentUserAvatar = localStorage.getItem('userAvatar') || DEFAULT_USER_AVATAR;

    // 添加保存聊天记录的函数
    function saveChatHistory() {
        localStorage.setItem('chatHistory', JSON.stringify(Array.from(chatHistory.entries())));
    }

    // 发送消息的函数
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            // 获取当前联系人
            const activeContact = document.querySelector('.contact-item.active');
            if (!activeContact) {
                alert('请先选择一个联系人');
                return;
            }

            const contactName = activeContact.querySelector('h3').textContent;
            
            // 创建用户消息
            const userMessage = document.createElement('div');
            userMessage.className = 'message user-message';
            userMessage.innerHTML = `
                <img src="${currentUserAvatar}" alt="用户" class="avatar">
                <div class="message-content">
                    <p>${message}</p>
                    <span class="message-time">${new Date().toLocaleTimeString()}</span>
                </div>
            `;
            messagesArea.appendChild(userMessage);
            
            // 清空输入框并调整高度
            messageInput.value = '';
            messageInput.style.height = 'auto';
            
            // 滚动到底部
            messagesArea.scrollTop = messagesArea.scrollHeight;

            // 更新联系人最后消息预览
            updateLastMessage(activeContact, message);
            
            // 保存聊天记录
            chatHistory.set(contactName, messagesArea.innerHTML);
            saveChatHistory();

            // 如果是AI助手对话，添加AI回复
            if (contactName === 'AI助手') {
                handleAIResponse(message);
            } else {
                // 普通联系人的自动回复
                setTimeout(() => {
                    const replyMessage = document.createElement('div');
                    replyMessage.className = 'message ai-message';
                    replyMessage.innerHTML = `
                        <img src="${activeContact.querySelector('img').src}" alt="${contactName}" class="avatar">
                        <div class="message-content">
                            <p>${generateContactResponse(contactName, message)}</p>
                            <span class="message-time">${new Date().toLocaleTimeString()}</span>
                        </div>
                    `;
                    messagesArea.appendChild(replyMessage);
                    messagesArea.scrollTop = messagesArea.scrollHeight;
                    
                    // 更新联系人最后消息预览
                    updateLastMessage(activeContact, replyMessage.querySelector('p').textContent);
                    
                    // 保存更新后的聊天记录
                    chatHistory.set(contactName, messagesArea.innerHTML);
                    saveChatHistory();
                }, 1000);
            }
        }
    }

    // 发送按钮点击事件
    sendButton.addEventListener('click', sendMessage);

    // 输入框回车发送
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // 阻止默认的换行行为
            sendMessage();
        }
    });

    // 添加输入框自动调整高度
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // 处理联系人点击事件的函数
    function handleContactClick(contactElement) {
        // 移除其他联系人的活动状态
        document.querySelectorAll('.contact-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 添加当前联系人的活动状态
        contactElement.classList.add('active');
        
        // 获取联系人名称
        const name = contactElement.querySelector('h3').textContent;
        
        // 保存当前聊天记录
        const currentContact = document.querySelector('.contact-item.active');
        if (currentContact && currentContact !== contactElement) {
            const currentName = currentContact.querySelector('h3').textContent;
            chatHistory.set(currentName, messagesArea.innerHTML);
            saveChatHistory();
        }
        
        // 清空消息区域
        messagesArea.innerHTML = '';
        
        // 恢复或显示聊天记录
        if (chatHistory.has(name)) {
            messagesArea.innerHTML = chatHistory.get(name);
            messagesArea.scrollTop = messagesArea.scrollHeight;
        } else if (name === 'AI助手') {
            // 如果是AI助手且没有聊天记录，显示欢迎消息
            const welcomeMessage = document.createElement('div');
            welcomeMessage.className = 'message ai-message';
            welcomeMessage.innerHTML = `
                <img src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png" alt="AI助手" class="avatar">
                <div class="message-content">
                    <p>你好！我是AI助手，很高兴为您服务。</p>
                    <span class="message-time">${new Date().toLocaleTimeString()}</span>
                </div>
            `;
            messagesArea.appendChild(welcomeMessage);
            chatHistory.set(name, messagesArea.innerHTML);
            saveChatHistory();
        } else {
            // 为新联系人显示欢迎消息
            const welcomeMessage = document.createElement('div');
            welcomeMessage.className = 'message ai-message';
            welcomeMessage.innerHTML = `
                <img src="${contactElement.querySelector('img').src}" alt="${name}" class="avatar">
                <div class="message-content">
                    <p>你好！开始和${name}聊天吧。</p>
                    <span class="message-time">${new Date().toLocaleTimeString()}</span>
                </div>
            `;
            messagesArea.appendChild(welcomeMessage);
            chatHistory.set(name, messagesArea.innerHTML);
            saveChatHistory();
        }
        
        // 更新联系人最后消息预览
        updateLastMessage(contactElement);
        
        // 启用输入区域
        const inputArea = document.querySelector('.input-area');
        inputArea.classList.remove('disabled');
        messageInput.focus();
    }

    // 为现有的AI助手添加点击事件
    const aiAssistant = document.querySelector('.contact-item');
    aiAssistant.addEventListener('click', function() {
        handleContactClick(this);
    });

    // 修改添加联系人的代码，为新联系人添加点击事件
    addContactBtn.addEventListener('click', function() {
        // 创建一个模态框来添加联系人
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>添加联系人</h2>
                <input type="text" id="contact-name" placeholder="联系人姓名">
                <div class="modal-buttons">
                    <button class="cancel-btn">取消</button>
                    <button class="confirm-btn">确认</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 处理取消按钮
        modal.querySelector('.cancel-btn').addEventListener('click', function() {
            modal.remove();
        });

        // 处理确认按钮
        modal.querySelector('.confirm-btn').addEventListener('click', function() {
            const name = document.getElementById('contact-name').value.trim();
            if (name) {
                const newContact = document.createElement('div');
                newContact.className = 'contact-item';
                newContact.innerHTML = `
                    <img src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png" alt="${name}" class="avatar">
                    <div class="contact-info">
                        <h3>${name}</h3>
                        <p>暂无消息</p>
                    </div>
                `;
                
                // 为新联系人添加点击事件
                newContact.addEventListener('click', function() {
                    handleContactClick(this);
                });
                
                // 将新联系人添加到列表顶部
                const firstContact = contactsList.firstChild;
                contactsList.insertBefore(newContact, firstContact);
                
                // 初始化聊天记录
                chatHistory.set(name, '');
                
                // 自动切换到新联系人
                handleContactClick(newContact);
                
                modal.remove();
            }
        });
    });

    // 修改文件消息的创建部分
    function createFileMessage(file, fileUrl) {
        const fileSize = formatFileSize(file.size);
        const fileIcon = getFileIcon(file.name);
        
        // 创建Blob URL以供下载
        const blobUrl = URL.createObjectURL(file);
        
        const message = document.createElement('div');
        message.className = 'message user-message';
        message.innerHTML = `
            <img src="${currentUserAvatar}" alt="用户" class="avatar">
            <div class="message-content">
                <div class="file-message">
                    <div class="file-icon">${fileIcon}</div>
                    <div class="file-info">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${fileSize}</div>
                    </div>
                    <a href="${blobUrl}" download="${file.name}" class="download-btn" title="下载文件">
                        <span>⬇️</span>
                    </a>
                </div>
                <span class="message-time">${new Date().toLocaleTimeString()}</span>
            </div>
        `;

        // 在消息被移除时释放Blob URL
        message.addEventListener('remove', () => URL.revokeObjectURL(blobUrl));
        
        return message;
    }

    // 修改文件处理函数
    function handleFileUpload(type) {
        const input = document.createElement('input');
        input.type = 'file';
        if (type === 'image') {
            input.accept = 'image/*';
        }
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                if (type === 'image') {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        // 为图片创建Blob URL
                        const blob = dataURLtoBlob(e.target.result);
                        const blobUrl = URL.createObjectURL(blob);
                        
                        const message = document.createElement('div');
                        message.className = 'message user-message';
                        message.innerHTML = `
                            <img src="${currentUserAvatar}" alt="用户" class="avatar">
                            <div class="message-content">
                                <img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 4px; cursor: pointer" onclick="window.open(this.src)">
                                <a href="${blobUrl}" download="${file.name}" class="download-btn" title="下载图片">
                                    <span>⬇️</span>
                                </a>
                                <span class="message-time">${new Date().toLocaleTimeString()}</span>
                            </div>
                        `;

                        // 在消息被移除时释放Blob URL
                        message.addEventListener('remove', () => URL.revokeObjectURL(blobUrl));
                        
                        messagesArea.appendChild(message);
                        messagesArea.scrollTop = messagesArea.scrollHeight;
                        
                        // 更新联系人最后消息预览
                        const activeContact = document.querySelector('.contact-item.active');
                        updateLastMessage(activeContact, '[图片]');
                        
                        // 保存聊天记录
                        chatHistory.set(activeContact.querySelector('h3').textContent, messagesArea.innerHTML);
                        saveChatHistory();
                    };
                    reader.readAsDataURL(file);
                } else {
                    const message = createFileMessage(file);
                    messagesArea.appendChild(message);
                    messagesArea.scrollTop = messagesArea.scrollHeight;
                    
                    // 更新联系人最后消息预览
                    const activeContact = document.querySelector('.contact-item.active');
                    updateLastMessage(activeContact, `[文件] ${file.name}`);
                    
                    // 保存聊天记录
                    chatHistory.set(activeContact.querySelector('h3').textContent, messagesArea.innerHTML);
                    saveChatHistory();
                }
            }
        };
        
        input.click();
    }

    // 添加DataURL转Blob的辅助函数
    function dataURLtoBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while(n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new Blob([u8arr], {type: mime});
    }

    // 添加文件下载相关的CSS样式
    const downloadStyle = document.createElement('style');
    downloadStyle.textContent = `
        .download-btn {
            padding: 6px;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.05);
        }

        .download-btn:hover {
            background: rgba(0, 0, 0, 0.1);
            transform: scale(1.05);
        }

        .download-btn span {
            font-size: 18px;
        }

        .file-message {
            position: relative;
            padding-right: 40px;
        }

        .file-message .download-btn {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
        }
    `;
    document.head.appendChild(downloadStyle);

    // 添加文件大小格式化函数
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 添加文件图标获取函数
    function getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            pdf: '📄',
            doc: '📝',
            docx: '📝',
            xls: '📊',
            xlsx: '📊',
            ppt: '📽️',
            pptx: '📽️',
            txt: '📃',
            zip: '📦',
            rar: '📦',
            '7z': '📦',
            mp3: '🎵',
            wav: '🎵',
            mp4: '🎥',
            avi: '🎥',
            mov: '🎥',
            default: '📎'
        };
        return icons[ext] || icons.default;
    }

    // 在文件中添加表情数组
    const EMOJIS = [
        '😊', '😂', '🤣', '❤️', '😍', '😒', '😘', '💕', 
        '😁', '👍', '🎉', '✨', '🌟', '💪', '🤔', '😅',
        '😃', '😄', '😋', '😎', '😴', '🥺', '😭', '😤'
    ];

    // 添加附件按钮点击事件处理
    const attachmentBtn = document.querySelector('.attachment-btn');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    attachmentBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });

    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', function(e) {
        if (!attachmentBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
            // 同时关闭表情选择器
            const emojiPicker = document.querySelector('.emoji-picker');
            if (emojiPicker) {
                emojiPicker.remove();
            }
        }
    });

    // 修改下拉菜单项的点击事件处理
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // 处理完后关闭下拉菜单
            dropdownMenu.classList.remove('show');
            
            const type = this.textContent.includes('图片') ? 'image' : 
                        this.textContent.includes('文件') ? 'file' : 'emoji';
            
            if (type === 'emoji') {
                // 创建表情选择器
                const emojiPicker = document.createElement('div');
                emojiPicker.className = 'emoji-picker';
                
                const emojiGrid = document.createElement('div');
                emojiGrid.className = 'emoji-grid';
                
                EMOJIS.forEach(emoji => {
                    const emojiItem = document.createElement('div');
                    emojiItem.className = 'emoji-item';
                    emojiItem.textContent = emoji;
                    emojiItem.onclick = function(e) {
                        e.stopPropagation();
                        messageInput.value += emoji;
                        messageInput.focus();
                        // 触发input事件以调整高度
                        messageInput.dispatchEvent(new Event('input'));
                    };
                    emojiGrid.appendChild(emojiItem);
                });
                
                emojiPicker.appendChild(emojiGrid);
                document.querySelector('.tool-buttons').appendChild(emojiPicker);
                emojiPicker.style.display = 'block';
                
                // 点击其他地方关闭表情选择器
                function closeEmojiPicker(e) {
                    if (!emojiPicker.contains(e.target) && !item.contains(e.target)) {
                        emojiPicker.remove();
                        document.removeEventListener('click', closeEmojiPicker);
                    }
                }
                
                // 延迟添加事件监听，避免立即触发
                setTimeout(() => {
                    document.addEventListener('click', closeEmojiPicker);
                }, 0);
                
            } else {
                // 处理文件上传
                const input = document.createElement('input');
                input.type = 'file';
                
                if (type === 'image') {
                    input.accept = 'image/*';
                    input.multiple = true; // 允许选择多张图片
                }
                
                input.onchange = function(e) {
                    const files = Array.from(e.target.files);
                    if (!files.length) return;
                    
                    files.forEach(file => {
                        if (type === 'image' && file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = function(e) {
                                const message = document.createElement('div');
                                message.className = 'message user-message';
                                message.innerHTML = `
                                    <img src="${currentUserAvatar}" alt="用户" class="avatar">
                                    <div class="message-content">
                                        <img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 4px; cursor: pointer" onclick="window.open(this.src)">
                                        <span class="message-time">${new Date().toLocaleTimeString()}</span>
                                    </div>
                                `;
                                messagesArea.appendChild(message);
                                messagesArea.scrollTop = messagesArea.scrollHeight;
                            };
                            reader.readAsDataURL(file);
                        } else {
                            // 处理其他类型的文件
                            const fileSize = file.size > 1024 * 1024 
                                ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
                                : (file.size / 1024).toFixed(1) + ' KB';
                                
                            const fileIcon = getFileIcon(file.name);
                            
                            const message = document.createElement('div');
                            message.className = 'message user-message';
                            message.innerHTML = `
                                <img src="${currentUserAvatar}" alt="用户" class="avatar">
                                <div class="message-content">
                                    <div class="file-message">
                                        <span>${fileIcon}</span>
                                        <div>
                                            <div class="file-name">${file.name}</div>
                                            <small>${fileSize}</small>
                                        </div>
                                    </div>
                                    <span class="message-time">${new Date().toLocaleTimeString()}</span>
                                </div>
                            `;
                            messagesArea.appendChild(message);
                            messagesArea.scrollTop = messagesArea.scrollHeight;
                        }
                    });
                };
                
                input.click();
            }
        });
    });

    // 在DOMContentLoaded事件处理函数中添加搜索相关代码
    const searchInput = document.querySelector('.search-box input');

    // 添加搜索功能
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        // 搜索联系人
        const contacts = document.querySelectorAll('.contact-item');
        contacts.forEach(contact => {
            const name = contact.querySelector('h3').textContent.toLowerCase();
            const description = contact.querySelector('p').textContent.toLowerCase();
            
            if (name.includes(searchTerm) || description.includes(searchTerm)) {
                contact.style.display = '';
                // 高亮匹配文本
                if (searchTerm) {
                    highlightText(contact.querySelector('h3'), searchTerm);
                    highlightText(contact.querySelector('p'), searchTerm);
                } else {
                    // 恢复原始文本
                    contact.querySelector('h3').innerHTML = name;
                    contact.querySelector('p').innerHTML = description;
                }
            } else {
                contact.style.display = 'none';
            }
        });
        
        // 搜索聊天记录
        if (searchTerm) {
            const messages = document.querySelectorAll('.message-content p');
            let hasHighlighted = false;
            
            messages.forEach(message => {
                const text = message.textContent.toLowerCase();
                const messageContainer = message.closest('.message');
                
                if (text.includes(searchTerm)) {
                    messageContainer.style.display = '';
                    highlightText(message, searchTerm);
                    if (!hasHighlighted) {
                        // 滚动到第一个匹配的消息
                        message.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        hasHighlighted = true;
                    }
                } else {
                    messageContainer.style.display = 'none';
                }
            });
            
            // 添加搜索结果计数
            showSearchResults(messages);
        } else {
            // 恢复所有消息显示
            document.querySelectorAll('.message').forEach(message => {
                message.style.display = '';
                const messageText = message.querySelector('p');
                if (messageText) {
                    messageText.innerHTML = messageText.textContent;
                }
            });
            
            // 移除搜索结果计数
            const searchResults = document.querySelector('.search-results');
            if (searchResults) {
                searchResults.remove();
            }
        }
    });

    // 高亮匹配文本
    function highlightText(element, searchTerm) {
        const text = element.textContent;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        element.innerHTML = text.replace(regex, '<span class="highlight">$1</span>');
    }

    // 显示搜索结果计数
    function showSearchResults(messages) {
        const visibleMessages = Array.from(messages).filter(message => 
            message.closest('.message').style.display !== 'none'
        ).length;
        
        let searchResults = document.querySelector('.search-results');
        if (!searchResults) {
            searchResults = document.createElement('div');
            searchResults.className = 'search-results';
            document.querySelector('.search-box').appendChild(searchResults);
        }
        
        searchResults.textContent = `找到 ${visibleMessages} 条相关消息`;
    }

    // 添加更新最后消息预览的函数
    function updateLastMessage(contactElement, message = null) {
        const description = contactElement.querySelector('p');
        if (message) {
            // 如果提供了新消息，更新预览
            description.textContent = message.length > 20 ? message.substring(0, 20) + '...' : message;
        } else {
            // 否则从聊天记录中获取最后一条消息
            const messages = messagesArea.querySelectorAll('.message-content p');
            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1].textContent;
                description.textContent = lastMessage.length > 20 ? lastMessage.substring(0, 20) + '...' : lastMessage;
            }
        }
    }

    // 修改 Deepseek API 配置
    const DEEPSEEK_API_KEY = 'sk-ca1255440a8f4b90abcf0ae67dd0b9a5';
    const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';  // 修改为正确的API端点

    // 修改 handleAIResponse 函数
    async function handleAIResponse(userMessage) {
        // 显示输入中状态
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message ai-message typing';
        typingIndicator.innerHTML = `
            <img src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png" alt="AI助手" class="avatar">
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        messagesArea.appendChild(typingIndicator);
        messagesArea.scrollTop = messagesArea.scrollHeight;

        try {
            // 获取历史对话记录
            const chatContext = getChatContext();
            
            // 调用 Deepseek API
            const response = await fetch(DEEPSEEK_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        {
                            role: "system",
                            content: "你是一个友好、专业的中文AI助手。请用简洁、自然的语言回答用户的问题。"
                        },
                        ...chatContext,
                        {
                            role: "user",
                            content: userMessage
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API错误: ${errorData.error?.message || '未知错误'}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;

            // 移除输入中状态
            typingIndicator.remove();
            
            // 创建AI回复消息
            const aiMessage = document.createElement('div');
            aiMessage.className = 'message ai-message';
            aiMessage.innerHTML = `
                <img src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png" alt="AI助手" class="avatar">
                <div class="message-content">
                    <p>${formatAIResponse(aiResponse)}</p>
                    <span class="message-time">${new Date().toLocaleTimeString()}</span>
                </div>
            `;
            messagesArea.appendChild(aiMessage);
            messagesArea.scrollTop = messagesArea.scrollHeight;
            
            // 更新联系人最后消息预览
            const aiContact = document.querySelector('.contact-item.active');
            updateLastMessage(aiContact, aiResponse);
            
            // 保存更新后的聊天记录
            chatHistory.set('AI助手', messagesArea.innerHTML);
            saveChatHistory();

        } catch (error) {
            console.error('AI回复错误:', error);
            
            // 移除输入中状态
            typingIndicator.remove();
            
            // 显示错误消息
            const errorMessage = document.createElement('div');
            errorMessage.className = 'message ai-message error';
            errorMessage.innerHTML = `
                <img src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png" alt="AI助手" class="avatar">
                <div class="message-content">
                    <p>抱歉，我遇到了一些问题：${error.message}</p>
                    <span class="message-time">${new Date().toLocaleTimeString()}</span>
                </div>
            `;
            messagesArea.appendChild(errorMessage);
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }
    }

    // 修改获取聊天上下文的函数
    function getChatContext() {
        const context = [];
        const messages = messagesArea.querySelectorAll('.message');
        
        messages.forEach(message => {
            const content = message.querySelector('.message-content p')?.textContent;
            if (content) {
                const role = message.classList.contains('user-message') ? 'user' : 'assistant';
                context.push({ role, content });
            }
        });

        // 只保留最近的5条消息作为上下文，以避免超出token限制
        return context.slice(-5);
    }

    // 添加AI回复格式化函数
    function formatAIResponse(response) {
        // 处理markdown格式
        response = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        response = response.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // 处理代码块
        response = response.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // 处理换行
        response = response.replace(/\n/g, '<br>');
        
        return response;
    }

    // 添加错误消息样式
    const errorStyle = document.createElement('style');
    errorStyle.textContent = `
        .message.error .message-content {
            background-color: #fff2f0;
            border: 1px solid #ffccc7;
        }
        
        .message.error .message-content p {
            color: #ff4d4f;
        }
        
        pre {
            background-color: #f6f8fa;
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
        }
        
        code {
            font-family: monospace;
            font-size: 14px;
        }
    `;
    document.head.appendChild(errorStyle);

    // 在页面加载时禁用输入区域
    document.addEventListener('DOMContentLoaded', function() {
        // ... 其他代码 ...
        
        // 初始禁用输入区域
        const inputArea = document.querySelector('.input-area');
        inputArea.classList.add('disabled');
        
        // ... 其他代码 ...
    });

    // 在DOMContentLoaded事件处理函数中添加设置相关代码
    const settingsBtn = document.querySelector('.settings-btn');
    const settingsMenu = document.querySelector('.settings-menu');
    const userAvatar = document.getElementById('userAvatar');
    const userNameInput = document.getElementById('userNameInput');
    const userStatus = document.getElementById('userStatus');
    const notificationToggle = document.getElementById('notificationToggle');
    const soundToggle = document.getElementById('soundToggle');

    // 设置按钮点击事件
    settingsBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        settingsMenu.classList.toggle('show');
    });

    // 点击其他地方关闭设置菜单
    document.addEventListener('click', function(e) {
        if (!settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
            settingsMenu.classList.remove('show');
        }
    });

    // 修改头像更换函数
    userAvatar.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const newAvatar = e.target.result;
                    // 更新所有用户头像
                    updateUserAvatar(newAvatar);
                    // 保存到本地存储
                    localStorage.setItem('userAvatar', newAvatar);
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    });

    // 添加更新用户头像的函数
    function updateUserAvatar(newAvatar) {
        // 更新当前头像变量
        currentUserAvatar = newAvatar;
        
        // 更新设置菜单中的头像
        userAvatar.src = newAvatar;
        
        // 更新所有用户消息中的头像
        document.querySelectorAll('.message.user-message .avatar').forEach(avatar => {
            avatar.src = newAvatar;
        });
    }

    // 用户名设置
    userNameInput.addEventListener('change', function() {
        const name = this.value.trim();
        if (name) {
            document.getElementById('userName').textContent = name;
            localStorage.setItem('userName', name);
        }
    });

    // 状态消息设置
    userStatus.addEventListener('change', function() {
        localStorage.setItem('userStatus', this.value);
    });

    // 主题切换
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const theme = this.dataset.theme;
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            
            // 更新按钮状态
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 通知设置
    notificationToggle.addEventListener('change', function() {
        localStorage.setItem('notifications', this.checked);
        if (this.checked) {
            requestNotificationPermission();
        }
    });

    soundToggle.addEventListener('change', function() {
        localStorage.setItem('sound', this.checked);
    });

    // 请求通知权限
    async function requestNotificationPermission() {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('通知权限已获取');
            }
        } catch (err) {
            console.error('无法获取通知权限:', err);
        }
    }

    // 加载保存的设置
    function loadSettings() {
        // 加载头像
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
            updateUserAvatar(savedAvatar);
        }
        
        // 加载用户名
        const savedName = localStorage.getItem('userName');
        if (savedName) {
            document.getElementById('userName').textContent = savedName;
            userNameInput.value = savedName;
        }
        
        // 加载状态消息
        const savedStatus = localStorage.getItem('userStatus');
        if (savedStatus) {
            userStatus.value = savedStatus;
        }
        
        // 加载主题
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        document.querySelector(`.theme-btn[data-theme="${savedTheme}"]`).classList.add('active');
        
        // 加载通知设置
        notificationToggle.checked = localStorage.getItem('notifications') === 'true';
        soundToggle.checked = localStorage.getItem('sound') === 'true';
    }

    // 页面加载时初始化设置
    loadSettings();

    // 添加头像相关的CSS样式
    const avatarStyle = document.createElement('style');
    avatarStyle.textContent = `
        .user-profile .avatar {
            object-fit: cover;
            border-radius: 50%;
            border: 2px solid var(--primary-color);
        }
        
        .message .avatar {
            object-fit: cover;
            transition: transform 0.2s;
        }
        
        .message .avatar:hover {
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(avatarStyle);

    // 添加清除聊天记录的功能
    function clearChatHistory(contactName) {
        if (chatHistory.has(contactName)) {
            chatHistory.delete(contactName);
            saveChatHistory();
            messagesArea.innerHTML = '';
            
            // 如果是AI助手，显示欢迎消息
            if (contactName === 'AI助手') {
                const welcomeMessage = document.createElement('div');
                welcomeMessage.className = 'message ai-message';
                welcomeMessage.innerHTML = `
                    <img src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png" alt="AI助手" class="avatar">
                    <div class="message-content">
                        <p>你好！我是AI助手，很高兴为您服务。</p>
                        <span class="message-time">${new Date().toLocaleTimeString()}</span>
                    </div>
                `;
                messagesArea.appendChild(welcomeMessage);
                chatHistory.set(contactName, messagesArea.innerHTML);
                saveChatHistory();
            }
        }
    }

    // 在设置菜单中添加清除聊天记录的选项
    const settingsContent = document.querySelector('.settings-content');
    const clearHistorySection = document.createElement('div');
    clearHistorySection.className = 'settings-section';
    clearHistorySection.innerHTML = `
        <h4>聊天记录</h4>
        <div class="setting-item">
            <button class="clear-history-btn">清除所有聊天记录</button>
        </div>
    `;
    settingsContent.appendChild(clearHistorySection);

    // 添加清除聊天记录按钮的点击事件
    document.querySelector('.clear-history-btn').addEventListener('click', function() {
        if (confirm('确定要清除所有聊天记录吗？此操作不可恢复。')) {
            chatHistory.clear();
            localStorage.removeItem('chatHistory');
            messagesArea.innerHTML = '';
            
            // 重新显示AI助手的欢迎消息
            const aiContact = document.querySelector('.contact-item[data-name="AI助手"]');
            if (aiContact && aiContact.classList.contains('active')) {
                clearChatHistory('AI助手');
            }
            
            // 更新所有联系人的最后消息预览
            document.querySelectorAll('.contact-item').forEach(contact => {
                const description = contact.querySelector('p');
                description.textContent = '暂无消息';
            });
        }
    });
}); 