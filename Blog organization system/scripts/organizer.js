class BlogOrganizer {
    constructor() {
        this.blogs = this.loadBlogs();
        this.tags = this.loadTags();
        this.currentMedia = null;
        this.mediaType = null;
        this.editingId = null;
        this.currentFilters = {
            keyword: '',
            timeFilter: 'all',
            timeValues: {},
            tagFilterMode: 'all',
            selectedTags: []
        };
        this.filteredBlogs = [...this.blogs];
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.renderTags();
        this.renderFilterTags();
        this.setupTimeFilterControls();
        this.renderBlogList();
        this.updateStats();
        this.setCurrentTime();
        this.updateFilterStats();
    }
    
    setupEventListeners() {
        // 保存和清空
        document.getElementById('saveButton').addEventListener('click', () => this.saveBlog());
        document.getElementById('clearButton').addEventListener('click', () => this.clearForm());
        
        // 时间设置
        document.getElementById('nowButton').addEventListener('click', () => this.setCurrentTime());
        
        // 多媒体上传
        document.getElementById('mediaUpload').addEventListener('click', () => {
            document.getElementById('mediaInput').click();
        });
        document.getElementById('mediaInput').addEventListener('change', (e) => this.handleMediaUpload(e));
        
        // 标签管理
        document.getElementById('newTagInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const tag = e.target.value.trim();
                if (tag) {
                    this.addTag(tag);
                    e.target.value = '';
                }
            }
        });
        
        // 筛选功能
        document.getElementById('keywordSearch').addEventListener('input', (e) => {
            this.currentFilters.keyword = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('timeFilterType').addEventListener('change', () => {
            this.currentFilters.timeFilter = document.getElementById('timeFilterType').value;
            this.setupTimeFilterControls();
            this.applyFilters();
        });
        
        // 标签筛选模式
        document.querySelectorAll('input[name="tagFilterMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentFilters.tagFilterMode = e.target.value;
                this.applyFilters();
            });
        });
        
        // 筛选按钮
        document.getElementById('applyFilterButton').addEventListener('click', () => {
            this.applyFilters();
        });
        
        document.getElementById('resetFilterButton').addEventListener('click', () => {
            this.resetFilters();
        });
        
        // 导入/导出
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
        
        reader.readAsDataURL(file);
    }
    
    addTag(tagName) {
        if (!tagName) return;
        
        tagName = tagName.trim();
        if (tagName.includes(',')) {
            // 支持逗号分隔多个标签
            tagName.split(',').forEach(tag => {
                const trimmedTag = tag.trim();
                if (trimmedTag && !this.tags.includes(trimmedTag)) {
                    this.tags.push(trimmedTag);
                }
            });
        } else {
            if (!this.tags.includes(tagName)) {
                this.tags.push(tagName);
            }
        }
        
        this.saveTags();
        this.renderTags();
        this.renderFilterTags();
        this.updateStats();
    }
    
    removeTag(tagName) {
        this.tags = this.tags.filter(tag => tag !== tagName);
        this.saveTags();
        this.renderTags();
        this.renderFilterTags();
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
    
    // 时间筛选控件
    setupTimeFilterControls() {
        const controlsDiv = document.getElementById('timeFilterControls');
        const filterType = document.getElementById('timeFilterType').value;
        
        let html = '';
        
        switch(filterType) {
            case 'year':
                html = `
                    <input type="number" id="filterYear" class="time-control" 
                           placeholder="年份" min="2000" max="2100" 
                           value="${this.currentFilters.timeValues.year || ''}">
                `;
                break;
                
            case 'month':
                html = `
                    <input type="number" id="filterYear" class="time-control" 
                           placeholder="年份" min="2000" max="2100"
                           value="${this.currentFilters.timeValues.year || ''}">
                    <input type="number" id="filterMonth" class="time-control" 
                           placeholder="月份" min="1" max="12"
                           value="${this.currentFilters.timeValues.month || ''}">
                `;
                break;
                
            case 'day':
                html = `
                    <input type="date" id="filterDate" class="time-control"
                           value="${this.currentFilters.timeValues.date || ''}">
                `;
                break;
                
            case 'range':
                html = `
                    <input type="date" id="filterStartDate" class="time-control" 
                           placeholder="开始日期"
                           value="${this.currentFilters.timeValues.startDate || ''}">
                    <input type="date" id="filterEndDate" class="time-control" 
                           placeholder="结束日期"
                           value="${this.currentFilters.timeValues.endDate || ''}">
                `;
                break;
                
            default:
                html = '';
        }
        
        controlsDiv.innerHTML = html;
        
        // 为动态生成的输入框添加事件监听
        const yearInput = document.getElementById('filterYear');
        const monthInput = document.getElementById('filterMonth');
        const dateInput = document.getElementById('filterDate');
        const startDateInput = document.getElementById('filterStartDate');
        const endDateInput = document.getElementById('filterEndDate');
        
        if (yearInput) {
            yearInput.addEventListener('input', () => {
                this.currentFilters.timeValues.year = yearInput.value;
                this.applyFilters();
            });
        }
        
        if (monthInput) {
            monthInput.addEventListener('input', () => {
                this.currentFilters.timeValues.month = monthInput.value;
                this.applyFilters();
            });
        }
        
        if (dateInput) {
            dateInput.addEventListener('change', () => {
                this.currentFilters.timeValues.date = dateInput.value;
                this.applyFilters();
            });
        }
        
        if (startDateInput) {
            startDateInput.addEventListener('change', () => {
                this.currentFilters.timeValues.startDate = startDateInput.value;
                this.applyFilters();
            });
        }
        
        if (endDateInput) {
            endDateInput.addEventListener('change', () => {
                this.currentFilters.timeValues.endDate = endDateInput.value;
                this.applyFilters();
            });
        }
    }
    
    // 渲染筛选标签
    renderFilterTags() {
        const container = document.getElementById('filterTagsContainer');
        container.innerHTML = '';
        
        this.tags.forEach(tag => {
            const isActive = this.currentFilters.selectedTags.includes(tag);
            const tagElement = document.createElement('div');
            tagElement.className = `filter-tag ${isActive ? 'active' : ''}`;
            tagElement.textContent = tag;
            
            tagElement.addEventListener('click', () => {
                this.toggleFilterTag(tag);
            });
            
            container.appendChild(tagElement);
        });
    }
    
    toggleFilterTag(tag) {
        const index = this.currentFilters.selectedTags.indexOf(tag);
        if (index === -1) {
            this.currentFilters.selectedTags.push(tag);
        } else {
            this.currentFilters.selectedTags.splice(index, 1);
        }
        this.renderFilterTags();
        this.applyFilters();
    }
    
    // 应用筛选
    applyFilters() {
        let filtered = [...this.blogs];
        const keyword = this.currentFilters.keyword.toLowerCase().trim();
        
        // 关键词筛选
        if (keyword) {
            filtered = filtered.filter(blog => {
                const contentMatch = blog.content && blog.content.toLowerCase().includes(keyword);
                const tagMatch = blog.tags && blog.tags.some(tag => 
                    tag.toLowerCase().includes(keyword)
                );
                return contentMatch || tagMatch;
            });
        }
        
        // 时间筛选
        const filterType = this.currentFilters.timeFilter;
        if (filterType !== 'all') {
            filtered = filtered.filter(blog => {
                const blogDate = new Date(blog.datetime);
                
                switch(filterType) {
                    case 'year':
                        const year = parseInt(this.currentFilters.timeValues.year);
                        if (!year) return true;
                        return blogDate.getFullYear() === year;
                        
                    case 'month':
                        const filterYear = parseInt(this.currentFilters.timeValues.year);
                        const filterMonth = parseInt(this.currentFilters.timeValues.month);
                        if (!filterYear || !filterMonth) return true;
                        return blogDate.getFullYear() === filterYear && 
                               blogDate.getMonth() + 1 === filterMonth;
                        
                    case 'day':
                        const filterDateStr = this.currentFilters.timeValues.date;
                        if (!filterDateStr) return true;
                        const filterDate = new Date(filterDateStr);
                        return blogDate.toDateString() === filterDate.toDateString();
                        
                    case 'range':
                        const startStr = this.currentFilters.timeValues.startDate;
                        const endStr = this.currentFilters.timeValues.endDate;
                        if (!startStr || !endStr) return true;
                        const startDate = new Date(startStr);
                        const endDate = new Date(endStr);
                        endDate.setHours(23, 59, 59, 999);
                        return blogDate >= startDate && blogDate <= endDate;
                        
                    default:
                        return true;
                }
            });
        }
        
        // 标签筛选
        const selectedTags = this.currentFilters.selectedTags;
        if (selectedTags.length > 0) {
            filtered = filtered.filter(blog => {
                const blogTags = blog.tags || [];
                
                switch(this.currentFilters.tagFilterMode) {
                    case 'any':
                        return selectedTags.some(tag => blogTags.includes(tag));
                    case 'allSelected':
                        return selectedTags.every(tag => blogTags.includes(tag));
                    default:
                        return true;
                }
            });
        }
        
        this.filteredBlogs = filtered;
        this.renderBlogList();
        this.updateFilterStats();
    }
    
    // 重置筛选
    resetFilters() {
        this.currentFilters = {
            keyword: '',
            timeFilter: 'all',
            timeValues: {},
            tagFilterMode: 'all',
            selectedTags: []
        };
        
        // 重置UI
        document.getElementById('keywordSearch').value = '';
        document.getElementById('timeFilterType').value = 'all';
        document.querySelector('#tagFilterAll').checked = true;
        
        this.setupTimeFilterControls();
        this.renderFilterTags();
        this.applyFilters();
    }
    
    // 更新筛选统计 - 修复显示问题
    updateFilterStats() {
        const total = this.blogs.length;
        const filtered = this.filteredBlogs.length;
        
        // 直接设置文本内容，不要使用innerHTML
        const countElement = document.getElementById('filteredCount');
        if (countElement) {
            countElement.textContent = filtered;
        }
        
        const statsElement = document.getElementById('filterStats');
        if (statsElement) {
            if (filtered === total) {
                statsElement.innerHTML = `显示全部 <span id="filteredCount">${filtered}</span> 条博客`;
            } else {
                statsElement.innerHTML = `显示 <span id="filteredCount">${filtered}</span> 条博客 (共 ${total} 条)`;
            }
        }
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
            // 编辑现有博客
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
            // 创建新博客
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
        this.applyFilters(); // 更新筛选结果
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
        
        // 处理媒体
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
        
        // 设置标签选中状态
        document.querySelectorAll('.tag').forEach(tag => {
            const tagText = tag.textContent.replace('×', '').trim();
            if (blog.tags && blog.tags.includes(tagText)) {
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
            this.applyFilters(); // 更新筛选结果
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
        
        if (this.filteredBlogs.length === 0) {
            let message = '暂无博客，开始创建第一条吧';
            if (this.blogs.length > 0 && this.filteredBlogs.length === 0) {
                message = '没有找到符合条件的博客';
            }
            container.innerHTML = `<div class="blog-item" style="text-align: center; color: #999;">${message}</div>`;
            return;
        }
        
        this.filteredBlogs.forEach(blog => {
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
                ${blog.tags && blog.tags.length > 0 ? `
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
    
    exportHtml() {
        try {
            // 使用筛选后的博客或所有博客
            const exportBlogs = this.filteredBlogs.length > 0 ? this.filteredBlogs : this.blogs;
            
            // 生成博客内容HTML
            const blogPostsHtml = exportBlogs.map(blog => {
                const date = new Date(blog.datetime);
                const dateStr = date.toLocaleDateString('zh-CN') + ' ' + 
                              date.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'});
                
                return `
                <div class="blog-post" data-id="${blog.id}">
                    <div class="post-header">
                        <small>${dateStr}</small>
                        <small>#${blog.id.toString().slice(-4)}</small>
                    </div>
                    ${blog.content ? `<div class="post-content">${blog.content}</div>` : ''}
                    ${blog.media ? (
                        blog.mediaType === 'image' 
                            ? `<img src="${blog.media}" style="max-width: 100%; margin: 10px 0;">`
                            : `<video src="${blog.media}" controls style="max-width: 100%; margin: 10px 0;"></video>`
                    ) : ''}
                    ${blog.tags && blog.tags.length > 0 ? `
                        <div class="tags">
                            ${blog.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>`;
            }).join('');
            
            // 生成完整HTML
            const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>导出的博客 - ${new Date().toLocaleDateString('zh-CN')}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Courier New', monospace; 
            background: #fafafa; 
            color: #333; 
            line-height: 1.6; 
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding-bottom: 15px;
            border-bottom: 2px solid #ddd;
        }
        .header h1 { 
            font-size: 24px; 
            color: #444; 
            margin-bottom: 10px;
        }
        .header-info { 
            font-size: 12px; 
            color: #888; 
        }
        .search-box {
            margin: 20px 0;
            padding: 15px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .search-box input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
        }
        .blog-post { 
            background: white; 
            border: 1px solid #ddd; 
            padding: 20px; 
            margin-bottom: 20px; 
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .post-header { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 15px; 
            font-size: 12px; 
            color: #666; 
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .post-content { 
            margin-bottom: 15px; 
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .tags { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 5px; 
            margin-top: 15px; 
        }
        .tag { 
            background: #f0f0f0; 
            color: #555; 
            padding: 4px 10px; 
            font-size: 11px; 
            border-radius: 12px;
            border: 1px solid #ddd;
        }
        img, video { 
            max-width: 100%; 
            max-height: 300px; 
            margin: 10px 0; 
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .stats {
            text-align: center;
            margin: 10px 0;
            color: #666;
            font-size: 13px;
        }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .blog-post { padding: 15px; }
            .post-header { flex-direction: column; gap: 5px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📝 博客存档</h1>
        <div class="header-info">
            导出时间：${new Date().toLocaleString('zh-CN')} | 
            共 ${exportBlogs.length} 条博客
        </div>
    </div>
    
    <div class="search-box">
        <input type="text" id="searchInput" placeholder="搜索博客内容或标签...">
        <div class="stats">
            显示 <span id="resultCount">${exportBlogs.length}</span> 条结果
        </div>
    </div>
    
    <div id="blogContainer">
        ${blogPostsHtml}
    </div>
    
    <div class="blog-post" style="text-align: center; color: #888; font-size: 12px;">
        好想吃甜甜圈
    </div>
    
    <script>
        const posts = document.querySelectorAll('.blog-post');
        const searchInput = document.getElementById('searchInput');
        const resultCount = document.getElementById('resultCount');
        
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            let visibleCount = 0;
            
            posts.forEach(post => {
                const content = post.textContent.toLowerCase();
                const tags = post.querySelectorAll('.tag');
                const postTags = Array.from(tags).map(tag => tag.textContent.toLowerCase());
                
                const matchesSearch = !searchTerm || 
                    content.includes(searchTerm) || 
                    postTags.some(tag => tag.includes(searchTerm));
                
                if (matchesSearch) {
                    post.style.display = 'block';
                    visibleCount++;
                } else {
                    post.style.display = 'none';
                }
            });
            
            resultCount.textContent = visibleCount;
        });
    </script>
</body>
</html>`;
            
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
    
    exportTxt() {
        const exportBlogs = this.filteredBlogs.length > 0 ? this.filteredBlogs : this.blogs;
        
        let txtContent = `像素博客导出\n`;
        txtContent += `导出时间：${new Date().toLocaleString('zh-CN')}\n`;
        txtContent += `博客数量：${exportBlogs.length}\n`;
        txtContent += `标签数量：${this.tags.length}\n`;
        txtContent += '='.repeat(50) + '\n\n';
        
        exportBlogs.forEach((blog, index) => {
            const date = new Date(blog.datetime);
            const dateStr = date.toLocaleString('zh-CN');
            
            txtContent += `【博客 #${index + 1}】\n`;
            txtContent += `时间：${dateStr}\n`;
            txtContent += `ID：#${blog.id.toString().slice(-4)}\n`;
            txtContent += `标签：${(blog.tags && blog.tags.join(', ')) || '无'}\n`;
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
                    alert('导入成功！'); // 添加成功提示
                } else {
                    alert('请选择.json文件');
                }
            } catch (error) {
                console.error('导入错误:', error);
                alert('导入失败：文件格式不正确');
            }
            event.target.value = '';
        };
        
        reader.onerror = () => {
            alert('文件读取失败');
            event.target.value = '';
        };
        
        reader.readAsText(file);
    }
    
    importJson(content) {
        try {
            const data = JSON.parse(content);
            
            // 兼容性处理
            if (Array.isArray(data)) {
                // 旧版本数据，直接是博客数组
                this.importOldFormat(data);
            } else if (data.blogs && Array.isArray(data.blogs)) {
                // 新版本数据
                this.importNewFormat(data);
            } else {
                throw new Error('无效的数据格式');
            }
            
            this.saveBlogs();
            this.saveTags();
            this.renderBlogList();
            this.renderTags();
            this.renderFilterTags();
            this.applyFilters();
            this.updateStats();
            
        } catch (error) {
            console.error('JSON解析错误:', error);
            // 尝试其他可能的格式
            try {
                // 可能是不带方括号的JSON数组
                const trimmedContent = content.trim();
                if (trimmedContent.startsWith('[') && trimmedContent.endsWith(']')) {
                    const blogsArray = JSON.parse(trimmedContent);
                    this.importOldFormat(blogsArray);
                    
                    this.saveBlogs();
                    this.saveTags();
                    this.renderBlogList();
                    this.renderTags();
                    this.renderFilterTags();
                    this.applyFilters();
                    this.updateStats();
                } else {
                    throw error;
                }
            } catch (e) {
                throw new Error('无法解析数据文件');
            }
        }
    }
    
    importOldFormat(blogsArray) {
        const existingIds = new Set(this.blogs.map(blog => blog.id));
        let newBlogCount = 0;
        
        blogsArray.forEach(blog => {
            // 确保博客有必要的字段
            if (!blog.id) blog.id = Date.now() + Math.random();
            if (!blog.created) blog.created = new Date().toISOString();
            if (!blog.tags) blog.tags = [];
            if (!blog.datetime) blog.datetime = blog.created;
            
            if (!existingIds.has(blog.id)) {
                this.blogs.push(blog);
                existingIds.add(blog.id);
                newBlogCount++;
                
                // 提取标签
                if (blog.tags && Array.isArray(blog.tags)) {
                    blog.tags.forEach(tag => {
                        if (tag && !this.tags.includes(tag)) {
                            this.tags.push(tag);
                        }
                    });
                }
            }
        });
        
        console.log(`导入 ${newBlogCount} 条新博客`);
    }
    
    importNewFormat(data) {
        const existingIds = new Set(this.blogs.map(blog => blog.id));
        let newBlogCount = 0;
        
        // 导入博客
        data.blogs.forEach(blog => {
            if (!existingIds.has(blog.id)) {
                this.blogs.push(blog);
                existingIds.add(blog.id);
                newBlogCount++;
            }
        });
        
        // 导入标签
        if (data.tags && Array.isArray(data.tags)) {
            data.tags.forEach(tag => {
                if (tag && !this.tags.includes(tag)) {
                    this.tags.push(tag);
                }
            });
        }
        
        console.log(`导入 ${newBlogCount} 条新博客`);
    }
    
    saveBlogs() {
        localStorage.setItem('pixel_blogs', JSON.stringify(this.blogs));
    }
    
    loadBlogs() {
        const data = localStorage.getItem('pixel_blogs');
        if (!data) return [];
        
        try {
            const blogs = JSON.parse(data);
            // 确保每个博客都有必要的字段
            return blogs.map(blog => ({
                id: blog.id || Date.now() + Math.random(),
                content: blog.content || '',
                media: blog.media || null,
                mediaType: blog.mediaType || null,
                datetime: blog.datetime || blog.created || new Date().toISOString(),
                tags: blog.tags || [],
                created: blog.created || new Date().toISOString(),
                updated: blog.updated || null
            }));
        } catch (e) {
            console.error('加载博客数据失败:', e);
            return [];
        }
    }
    
    saveTags() {
        localStorage.setItem('pixel_tags', JSON.stringify(this.tags));
    }
    
    loadTags() {
        try {
            const data = localStorage.getItem('pixel_tags');
            return data ? JSON.parse(data) : ['日常', '技术', '思考', '记录'];
        } catch (e) {
            console.error('加载标签数据失败:', e);
            return ['日常', '技术', '思考', '记录'];
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.blogOrganizer = new BlogOrganizer();
});