class BlogOrganizer {
    constructor() {
        this.blogs = this.loadBlogs();
        this.tags = this.loadTags();
        this.currentMedia = null;
        this.mediaType = null;
        this.editingId = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.renderTags();
        this.renderBlogList();
        this.updateStats();
        this.setCurrentTime();
    }
    
    setupEventListeners() {
        document.getElementById('saveButton').addEventListener('click', () => this.saveBlog());
        document.getElementById('clearButton').addEventListener('click', () => this.clearForm());
        
        document.getElementById('nowButton').addEventListener('click', () => this.setCurrentTime());
        
        document.getElementById('mediaUpload').addEventListener('click', () => {
            document.getElementById('mediaInput').click();
        });
        document.getElementById('mediaInput').addEventListener('change', (e) => this.handleMediaUpload(e));
        
        document.getElementById('newTagInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTag(e.target.value.trim());
                e.target.value = '';
            }
        });
        
        document.getElementById('importButton').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });
        
        document.getElementById('exportButton').addEventListener('click', () => {
            const options = document.getElementById('exportOptions');
            options.style.display = options.style.display === 'none' ? 'grid' : 'none';
        });
        
        document.getElementById('importFileInput').addEventListener('change', (e) => this.handleImport(e));
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
        document.getElementById('exportHtml').addEventListener('click', () => this.exportHtml());
        document.getElementById('exportTxt').addEventListener('click', () => this.exportTxt());
    }
    
    setCurrentTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        document.getElementById('datetimeInput').value = localDateTime;
    }
    
    handleMediaUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            alert('文件大小不能超过5MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentMedia = e.target.result;
            this.mediaType = file.type.startsWith('image/') ? 'image' : 'video';
            
            const preview = document.getElementById('mediaPreview');
            preview.innerHTML = '';
            
            if (this.mediaType === 'image') {
                const img = document.createElement('img');
                img.src = this.currentMedia;
                img.className = 'media-preview';
                preview.appendChild(img);
            } else {
                const video = document.createElement('video');
                video.src = this.currentMedia;
                video.className = 'media-preview';
                video.controls = true;
                preview.appendChild(video);
            }
        };
        
        reader.onerror = () => {
            alert('文件读取失败');
        };
        
        reader.readAsDataURL(file);
    }
    
    addTag(tagName) {
        if (!tagName) return;
        
        tagName = tagName.trim().replace(/[,\s]+/g, ' ');
        
        if (!tagName || this.tags.includes(tagName)) return;
        
        this.tags.push(tagName);
        this.saveTags();
        this.renderTags();
        this.updateStats();
    }
    
    removeTag(tagName) {
        this.tags = this.tags.filter(tag => tag !== tagName);
        this.saveTags();
        this.renderTags();
        this.updateStats();
    }
    
    renderTags() {
        const container = document.getElementById('tagContainer');
        container.innerHTML = '';
        
        this.tags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                ${tag}
                <span class="remove-tag" data-tag="${tag}">×</span>
            `;
            
            tagElement.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-tag')) {
                    this.removeTag(tag);
                } else {
                    tagElement.classList.toggle('active');
                }
            });
            
            container.appendChild(tagElement);
        });
    }
    
    getSelectedTags() {
        const selected = [];
        document.querySelectorAll('.tag.active').forEach(tag => {
            selected.push(tag.textContent.replace('×', '').trim());
        });
        return selected;
    }
    
    saveBlog() {
        const content = document.getElementById('contentInput').value.trim();
        const datetime = document.getElementById('datetimeInput').value;
        const selectedTags = this.getSelectedTags();
        
        if (!content && !this.currentMedia) {
            alert('请输入内容或上传多媒体文件');
            return;
        }
        
        if (this.editingId) {
            const index = this.blogs.findIndex(blog => blog.id === this.editingId);
            if (index !== -1) {
                this.blogs[index] = {
                    ...this.blogs[index],
                    content,
                    media: this.currentMedia || this.blogs[index].media,
                    mediaType: this.mediaType || this.blogs[index].mediaType,
                    datetime: datetime || this.blogs[index].datetime,
                    tags: selectedTags,
                    updated: new Date().toISOString()
                };
            }
            this.editingId = null;
            document.getElementById('saveButton').innerHTML = '<i class="fas fa-save"></i> 保存博客';
        } else {
            const blog = {
                id: Date.now(),
                content,
                media: this.currentMedia,
                mediaType: this.mediaType,
                datetime: datetime || new Date().toISOString(),
                tags: selectedTags,
                created: new Date().toISOString(),
                updated: null
            };
            
            this.blogs.unshift(blog);
        }
        
        this.saveBlogs();
        this.renderBlogList();
        this.clearForm();
        this.updateStats();
    }
    
    editBlog(id) {
        const blog = this.blogs.find(b => b.id === id);
        if (!blog) return;
        
        document.getElementById('contentInput').value = blog.content || '';
        
        if (blog.datetime) {
            const date = new Date(blog.datetime);
            const localDateTime = date.toISOString().slice(0, 16);
            document.getElementById('datetimeInput').value = localDateTime;
        }
        
        this.currentMedia = blog.media;
        this.mediaType = blog.mediaType;
        const preview = document.getElementById('mediaPreview');
        preview.innerHTML = '';
        
        if (blog.media) {
            if (blog.mediaType === 'image') {
                const img = document.createElement('img');
                img.src = blog.media;
                img.className = 'media-preview';
                preview.appendChild(img);
            } else {
                const video = document.createElement('video');
                video.src = blog.media;
                video.className = 'media-preview';
                video.controls = true;
                preview.appendChild(video);
            }
        }
        
        document.querySelectorAll('.tag').forEach(tag => {
            const tagText = tag.textContent.replace('×', '').trim();
            if (blog.tags.includes(tagText)) {
                tag.classList.add('active');
            } else {
                tag.classList.remove('active');
            }
        });
        
        this.editingId = id;
        document.getElementById('saveButton').innerHTML = '<i class="fas fa-edit"></i> 更新博客';
        
        document.querySelector('#contentInput').scrollIntoView({ behavior: 'smooth' });
    }
    
    deleteBlog(id) {
        if (confirm('确定要删除这条博客吗？')) {
            this.blogs = this.blogs.filter(blog => blog.id !== id);
            this.saveBlogs();
            this.renderBlogList();
            this.updateStats();
        }
    }
    
    clearForm() {
        document.getElementById('contentInput').value = '';
        document.getElementById('datetimeInput').value = '';
        document.getElementById('mediaInput').value = '';
        document.getElementById('mediaPreview').innerHTML = '';
        document.getElementById('newTagInput').value = '';
        this.currentMedia = null;
        this.mediaType = null;
        this.editingId = null;
        
        document.querySelectorAll('.tag.active').forEach(tag => {
            tag.classList.remove('active');
        });
        
        document.getElementById('saveButton').innerHTML = '<i class="fas fa-save"></i> 保存博客';
        this.setCurrentTime();
    }
    
    renderBlogList() {
        const container = document.getElementById('blogList');
        container.innerHTML = '';
        
        if (this.blogs.length === 0) {
            container.innerHTML = '<div class="blog-item" style="text-align: center; color: #999;">暂无博客，开始创建第一条吧</div>';
            return;
        }
        
        this.blogs.forEach(blog => {
            const date = new Date(blog.datetime);
            const dateStr = date.toLocaleDateString('zh-CN', { 
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }) + ' ' + date.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const item = document.createElement('div');
            item.className = 'blog-item';
            item.innerHTML = `
                <div class="blog-item-header">
                    <span>${dateStr}</span>
                    <span>#${blog.id.toString().slice(-4)}</span>
                </div>
                <div class="blog-item-content">
                    ${blog.content ? blog.content.substring(0, 150) + (blog.content.length > 150 ? '...' : '') : '[多媒体内容]'}
                </div>
                ${blog.tags.length > 0 ? `
                    <div class="blog-item-tags">
                        ${blog.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="blog-item-actions">
                    <button class="action-btn edit-btn" data-id="${blog.id}">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="action-btn delete-btn" data-id="${blog.id}">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            `;
            
            item.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.editBlog(blog.id);
            });
            
            item.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteBlog(blog.id);
            });
            
            container.appendChild(item);
        });
    }
    
    updateStats() {
        document.getElementById('totalBlogs').textContent = this.blogs.length;
        document.getElementById('totalTags').textContent = this.tags.length;
    }
    
    exportData() {
        const data = {
            blogs: this.blogs,
            tags: this.tags,
            version: '2.0',
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blog_data_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // 修改了这里的 exportHtml 函数，添加完整的筛选系统
    exportHtml() {
        try {
            // 获取所有标签
            const allTags = [...new Set(this.blogs.flatMap(blog => blog.tags))];
            
            // 生成完整的HTML页面，包含筛选系统
            const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>博客存档 - ${new Date().toLocaleDateString('zh-CN')}</title>
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
            font-family: 'Courier New', '等宽', monospace;
        }
        
        body { 
            background: #fafafa; 
            color: #333; 
            line-height: 1.6; 
            padding: 20px;
            max-width: 1000px;
            margin: 0 auto;
            font-size: 14px;
        }
        
        .header { 
            text-align: center; 
            margin-bottom: 25px; 
            padding-bottom: 20px;
            border-bottom: 2px solid #ddd;
        }
        
        .header h1 { 
            font-size: 28px; 
            color: #444; 
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .header-info { 
            font-size: 13px; 
            color: #666; 
            margin-top: 10px;
        }
        
        /* 筛选系统样式 */
        .filter-section {
            background: white;
            border: 1px solid #ddd;
            padding: 20px;
            margin-bottom: 25px;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            position: sticky;
            top: 10px;
            z-index: 100;
        }
        
        .filter-group {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .filter-row {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .tag-filter {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 15px 0;
            padding: 15px 0;
            border-top: 1px solid #eee;
            border-bottom: 1px solid #eee;
        }
        
        .tag-filter-btn {
            background: #f0f0f0;
            color: #555;
            padding: 6px 14px;
            font-size: 12px;
            border: 1px solid #ddd;
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .tag-filter-btn:hover {
            background: #e0e0e0;
        }
        
        .tag-filter-btn.active {
            background: #333;
            color: white;
            border-color: #333;
        }
        
        .date-filter {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            align-items: end;
        }
        
        .date-filter label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
            display: block;
        }
        
        .search-box {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            margin-top: 10px;
            transition: border 0.2s;
        }
        
        .search-box:focus {
            outline: none;
            border-color: #888;
            box-shadow: 0 0 0 2px rgba(0,0,0,0.05);
        }
        
        .filter-buttons {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .filter-btn {
            padding: 10px 20px;
            background: #555;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            transition: background 0.2s;
        }
        
        .filter-btn:hover {
            background: #333;
        }
        
        .clear-btn {
            background: #999;
        }
        
        .clear-btn:hover {
            background: #777;
        }
        
        /* 博客文章样式 */
        .blog-post { 
            background: white; 
            border: 1px solid #ddd; 
            padding: 25px; 
            margin-bottom: 20px; 
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.04);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .blog-post:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .post-header { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 18px; 
            font-size: 13px; 
            color: #777; 
            padding-bottom: 12px;
            border-bottom: 1px solid #eee;
        }
        
        .post-content { 
            margin-bottom: 20px; 
            white-space: pre-wrap;
            word-wrap: break-word;
            line-height: 1.7;
        }
        
        .post-tags { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 6px; 
            margin-top: 18px; 
        }
        
        .post-tag { 
            background: #f5f5f5; 
            color: #666; 
            padding: 5px 12px; 
            font-size: 11px; 
            border-radius: 14px;
            border: 1px solid #e0e0e0;
        }
        
        img, video { 
            max-width: 100%; 
            max-height: 400px; 
            margin: 15px 0; 
            border: 1px solid #ddd;
            border-radius: 4px;
            display: block;
        }
        
        .no-results {
            text-align: center;
            padding: 60px 20px;
            color: #999;
            font-size: 16px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 6px;
            margin: 20px 0;
        }
        
        .stats-bar {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #777;
            margin-top: 20px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 4px;
            border: 1px solid #eee;
        }
        
        @media (max-width: 768px) {
            body { padding: 15px; }
            .blog-post { padding: 20px; }
            .filter-group { grid-template-columns: 1fr; }
            .date-filter { grid-template-columns: 1fr; }
            .tag-filter-btn { padding: 5px 12px; font-size: 11px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📝 博客存档</h1>
        <div class="header-info">
            导出时间：${new Date().toLocaleString('zh-CN')} | 
            共 ${this.blogs.length} 条博客 | 
            ${allTags.length} 个标签
        </div>
    </div>
    
    <!-- 筛选系统 -->
    <div class="filter-section">
        <h3 style="margin-bottom: 15px; color: #444;">🔍 筛选系统</h3>
        
        <!-- 标签筛选 -->
        <div class="tag-filter">
            ${allTags.length > 0 ? allTags.map(tag => 
                `<button class="tag-filter-btn" data-tag="${tag}">${tag}</button>`
            ).join('') : '<span style="color: #999;">暂无标签</span>'}
        </div>
        
        <!-- 日期筛选 -->
        <div class="filter-group">
            <div class="date-filter">
                <div>
                    <label>开始日期</label>
                    <input type="date" id="dateFrom" class="search-box" style="margin-top: 5px;">
                </div>
                <div>
                    <label>结束日期</label>
                    <input type="date" id="dateTo" class="search-box" style="margin-top: 5px;">
                </div>
            </div>
        </div>
        
        <!-- 关键词搜索 -->
        <div>
            <label for="searchBox">关键词搜索</label>
            <input type="text" id="searchBox" class="search-box" placeholder="输入关键词搜索博客内容...">
        </div>
        
        <!-- 操作按钮 -->
        <div class="filter-buttons">
            <button class="filter-btn" id="applyFilters">应用筛选</button>
            <button class="filter-btn clear-btn" id="clearFilters">清除筛选</button>
        </div>
    </div>
    
    <!-- 结果统计 -->
    <div class="stats-bar">
        <span id="resultCount">找到 ${this.blogs.length} 条博客</span>
        <span id="activeFilters">无筛选条件</span>
    </div>
    
    <!-- 博客列表 -->
    <div id="blogPosts">
        ${this.blogs.map(blog => this.generateBlogPostHtml(blog)).join('')}
    </div>
    
    <div id="noResults" class="no-results" style="display: none;">
        <p>没有找到匹配的博客</p>
        <p style="font-size: 14px; margin-top: 10px; color: #aaa;">尝试调整筛选条件或清除筛选</p>
    </div>
    
    <div class="blog-post" style="text-align: center; color: #888; font-size: 13px; background: #f9f9f9;">
        使用像素博客整理器生成 | 共 ${this.blogs.length} 条博客 | ${new Date().getFullYear()}
    </div>
    
    <script>
        // 博客数据
        const blogData = ${JSON.stringify(this.blogs)};
        
        // 筛选功能实现
        function filterBlogs() {
            const searchTerm = document.getElementById('searchBox').value.toLowerCase().trim();
            const dateFrom = document.getElementById('dateFrom').value;
            const dateTo = document.getElementById('dateTo').value;
            const selectedTags = Array.from(document.querySelectorAll('.tag-filter-btn.active'))
                .map(btn => btn.dataset.tag);
            
            let activeFilters = [];
            
            const filtered = blogData.filter(blog => {
                let match = true;
                
                // 1. 关键词搜索
                if (searchTerm) {
                    const contentMatch = blog.content?.toLowerCase().includes(searchTerm) || false;
                    const tagMatch = blog.tags.some(tag => tag.toLowerCase().includes(searchTerm));
                    if (!contentMatch && !tagMatch) {
                        match = false;
                    }
                }
                
                // 2. 日期范围筛选
                if (dateFrom || dateTo) {
                    const blogDate = blog.datetime.split('T')[0];
                    if (dateFrom && blogDate < dateFrom) match = false;
                    if (dateTo && blogDate > dateTo) match = false;
                }
                
                // 3. 标签筛选（支持多选）
                if (selectedTags.length > 0) {
                    const hasAllSelectedTags = selectedTags.every(tag => blog.tags.includes(tag));
                    if (!hasAllSelectedTags) match = false;
                }
                
                return match;
            });
            
            // 更新结果统计
            document.getElementById('resultCount').textContent = \`找到 \${filtered.length} 条博客\`;
            
            // 更新激活的筛选条件显示
            activeFilters = [];
            if (searchTerm) activeFilters.push(\`关键词: "\${searchTerm}"\`);
            if (dateFrom) activeFilters.push(\`从: \${dateFrom}\`);
            if (dateTo) activeFilters.push(\`到: \${dateTo}\`);
            if (selectedTags.length > 0) activeFilters.push(\`标签: \${selectedTags.join(', ')}\`);
            
            document.getElementById('activeFilters').textContent = 
                activeFilters.length > 0 ? activeFilters.join(' | ') : '无筛选条件';
            
            // 显示结果
            const container = document.getElementById('blogPosts');
            const noResults = document.getElementById('noResults');
            
            if (filtered.length === 0) {
                container.innerHTML = '';
                noResults.style.display = 'block';
            } else {
                container.innerHTML = filtered.map(blog => {
                    const date = new Date(blog.datetime);
                    const dateStr = date.toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }) + ' ' + date.toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    return \`
                    <div class="blog-post">
                        <div class="post-header">
                            <span>\${dateStr}</span>
                            <span>#\${blog.id.toString().slice(-4)}</span>
                        </div>
                        \${blog.content ? \`<div class="post-content">\${blog.content}</div>\` : ''}
                        \${blog.media ? (
                            blog.mediaType === 'image' 
                                ? \`<img src="\${blog.media}" alt="博客图片">\`
                                : \`<video src="\${blog.media}" controls></video>\`
                        ) : ''}
                        \${blog.tags.length > 0 ? \`
                            <div class="post-tags">
                                \${blog.tags.map(tag => \`<span class="post-tag">\${tag}</span>\`).join('')}
                            </div>
                        \` : ''}
                    </div>
                    \`;
                }).join('');
                noResults.style.display = 'none';
            }
        }
        
        // 初始化事件监听
        function initFilters() {
            // 标签筛选按钮
            document.querySelectorAll('.tag-filter-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    this.classList.toggle('active');
                    filterBlogs();
                });
            });
            
            // 日期筛选
            document.getElementById('dateFrom').addEventListener('change', filterBlogs);
            document.getElementById('dateTo').addEventListener('change', filterBlogs);
            
            // 关键词搜索
            document.getElementById('searchBox').addEventListener('input', function() {
                // 防抖处理
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => filterBlogs(), 300);
            });
            
            // 应用筛选按钮
            document.getElementById('applyFilters').addEventListener('click', filterBlogs);
            
            // 清除筛选按钮
            document.getElementById('clearFilters').addEventListener('click', function() {
                // 清除所有筛选条件
                document.getElementById('searchBox').value = '';
                document.getElementById('dateFrom').value = '';
                document.getElementById('dateTo').value = '';
                document.querySelectorAll('.tag-filter-btn.active').forEach(btn => {
                    btn.classList.remove('active');
                });
                filterBlogs();
            });
            
            // 初始筛选
            filterBlogs();
        }
        
        // 页面加载完成后初始化
        document.addEventListener('DOMContentLoaded', initFilters);
    </script>
</body>
</html>`;
            
            // 创建下载
            const blob = new Blob([htmlContent], {type: 'text/html;charset=utf-8'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `博客存档_${new Date().toISOString().slice(0,10)}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('导出HTML失败:', error);
            alert('导出HTML时出错：' + error.message);
        }
    }
    
    // 辅助函数：生成单个博客文章的HTML
    generateBlogPostHtml(blog) {
        const date = new Date(blog.datetime);
        const dateStr = date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }) + ' ' + date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
        <div class="blog-post">
            <div class="post-header">
                <span>${dateStr}</span>
                <span>#${blog.id.toString().slice(-4)}</span>
            </div>
            ${blog.content ? `<div class="post-content">${blog.content}</div>` : ''}
            ${blog.media ? (
                blog.mediaType === 'image' 
                    ? `<img src="${blog.media}" alt="博客图片">`
                    : `<video src="${blog.media}" controls></video>`
            ) : ''}
            ${blog.tags.length > 0 ? `
                <div class="post-tags">
                    ${blog.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
        </div>`;
    }
    
    exportTxt() {
        let txtContent = `像素博客导出\n`;
        txtContent += `导出时间：${new Date().toLocaleString('zh-CN')}\n`;
        txtContent += `博客数量：${this.blogs.length}\n`;
        txtContent += `标签数量：${this.tags.length}\n`;
        txtContent += '='.repeat(50) + '\n\n';
        
        this.blogs.forEach((blog, index) => {
            const date = new Date(blog.datetime);
            const dateStr = date.toLocaleString('zh-CN');
            
            txtContent += `【博客 #${index + 1}】\n`;
            txtContent += `时间：${dateStr}\n`;
            txtContent += `ID：#${blog.id.toString().slice(-4)}\n`;
            txtContent += `标签：${blog.tags.join(', ') || '无'}\n`;
            txtContent += '-'.repeat(30) + '\n';
            txtContent += `${blog.content || '[多媒体内容]'}\n`;
            if (blog.media) {
                txtContent += `\n[包含${blog.mediaType === 'image' ? '图片' : '视频'}文件]\n`;
            }
            txtContent += '\n' + '='.repeat(50) + '\n\n';
        });
        
        const blob = new Blob([txtContent], {type: 'text/plain;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `博客_${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (file.name.endsWith('.json')) {
                    this.importJson(e.target.result);
                } else if (file.name.endsWith('.html')) {
                    this.importHtml(e.target.result);
                } else {
                    alert('请选择.json或.html文件');
                }
            } catch (error) {
                alert('导入失败：' + error.message);
            }
            event.target.value = '';
        };
        
        reader.readAsText(file);
    }
    
    importJson(content) {
        const data = JSON.parse(content);
        
        if (!data.blogs || !Array.isArray(data.blogs)) {
            throw new Error('无效的数据格式');
        }
        
        const existingIds = new Set(this.blogs.map(blog => blog.id));
        const newBlogs = data.blogs.filter(blog => !existingIds.has(blog.id));
        
        this.blogs = [...this.blogs, ...newBlogs];
        
        if (data.tags && Array.isArray(data.tags)) {
            data.tags.forEach(tag => {
                if (!this.tags.includes(tag)) {
                    this.tags.push(tag);
                }
            });
        }
        
        this.saveBlogs();
        this.saveTags();
        this.renderBlogList();
        this.renderTags();
        this.updateStats();
        
        alert(`导入成功！\n新增博客：${newBlogs.length}条\n现有博客：${this.blogs.length}条`);
    }
    
    importHtml(content) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            
            let importedBlogs = [];
            const scripts = doc.querySelectorAll('script');
            
            scripts.forEach(script => {
                const text = script.textContent;
                const matches = text.match(/const blogData = (\[[\s\S]*?\]);/);
                if (matches) {
                    try {
                        importedBlogs = JSON.parse(matches[1]);
                    } catch (e) {
                        console.warn('解析JSON失败:', e);
                    }
                }
            });
            
            if (importedBlogs.length === 0) {
                const posts = doc.querySelectorAll('.blog-post');
                importedBlogs = Array.from(posts).map((post, index) => {
                    const header = post.querySelector('.post-header');
                    const dateText = header ? header.textContent : '';
                    const content = post.querySelector('.post-content')?.textContent || '';
                    const tags = Array.from(post.querySelectorAll('.post-tag')).map(tag => tag.textContent);
                    
                    return {
                        id: Date.now() + index,
                        content: content.trim(),
                        datetime: new Date().toISOString(),
                        tags: tags,
                        created: new Date().toISOString()
                    };
                });
            }
            
            if (importedBlogs.length > 0) {
                const existingIds = new Set(this.blogs.map(blog => blog.id));
                const newBlogs = importedBlogs.filter(blog => !existingIds.has(blog.id));
                this.blogs = [...this.blogs, ...newBlogs];
                
                const allTags = new Set(this.tags);
                importedBlogs.forEach(blog => {
                    blog.tags.forEach(tag => allTags.add(tag));
                });
                this.tags = Array.from(allTags);
                
                this.saveBlogs();
                this.saveTags();
                this.renderBlogList();
                this.renderTags();
                this.updateStats();
                
                alert(`导入成功！\n新增博客：${newBlogs.length}条`);
            } else {
                alert('在文件中未找到可导入的博客数据');
            }
        } catch (error) {
            console.error('导入HTML失败:', error);
            alert('导入失败：' + error.message);
        }
    }
    
    saveBlogs() {
        localStorage.setItem('pixel_blogs', JSON.stringify(this.blogs));
    }
    
    loadBlogs() {
        const data = localStorage.getItem('pixel_blogs');
        return data ? JSON.parse(data) : [];
    }
    
    saveTags() {
        localStorage.setItem('pixel_tags', JSON.stringify(this.tags));
    }
    
    loadTags() {
        const data = localStorage.getItem('pixel_tags');
        return data ? JSON.parse(data) : ['日常', '技术', '思考', '记录'];
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.blogOrganizer = new BlogOrganizer();
});