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
        
        // 修正时间设置
        document.getElementById('nowButton').addEventListener('click', () => this.setCurrentTime());
        
        // 多媒体上传
        document.getElementById('mediaUpload').addEventListener('click', () => {
            document.getElementById('mediaInput').click();
        });
        document.getElementById('mediaInput').addEventListener('change', (e) => this.handleMediaUpload(e));
        
        // 标签管理
        document.getElementById('newTagInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTag(e.target.value.trim());
                e.target.value = '';
            }
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
    
    // 修正时间设置函数
    setCurrentTime() {
        const now = new Date();
        // 转换为本地时间字符串，格式为 YYYY-MM-DDTHH:mm
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
        
        // 验证文件大小（限制为5MB）
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
        
        // 清理标签文本
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
        this.renderBlogList();
        this.clearForm();
        this.updateStats();
    }
    
    editBlog(id) {
        const blog = this.blogs.find(b => b.id === id);
        if (!blog) return;
        
        // 填充表单
        document.getElementById('contentInput').value = blog.content || '';
        
        if (blog.datetime) {
            // 转换时间格式
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
            if (blog.tags.includes(tagText)) {
                tag.classList.add('active');
            } else {
                tag.classList.remove('active');
            }
        });
        
        this.editingId = id;
        document.getElementById('saveButton').innerHTML = '<i class="fas fa-edit"></i> 更新博客';
        
        // 滚动到表单
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
            
            // 添加编辑和删除按钮事件
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
            // 获取样式内容
            const styleResponse = fetch('style.css')
                .then(response => response.text())
                .catch(() => {
                    // 如果无法获取外部CSS，使用内联基本样式
                    return `body { font-family: monospace; margin: 20px; background: #fafafa; color: #333; }
                    .blog-post { background: white; border: 1px solid #ddd; padding: 15px; margin: 10px 0; }
                    .tags { display: flex; flex-wrap: wrap; gap: 5px; margin: 10px 0; }
                    .tag { background: #eee; padding: 3px 8px; font-size: 12px; }`;
                });
            
            // 生成博客内容HTML
            const blogPostsHtml = this.blogs.map(blog => {
                const date = new Date(blog.datetime);
                const dateStr = date.toLocaleDateString('zh-CN') + ' ' + 
                              date.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'});
                
                return `
                <div class="blog-post">
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
                    ${blog.tags.length > 0 ? `
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
        @media (max-width: 600px) {
            body { padding: 10px; }
            .blog-post { padding: 15px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📝 博客存档</h1>
        <div class="header-info">
            导出时间：${new Date().toLocaleString('zh-CN')} | 
            共 ${this.blogs.length} 条博客
        </div>
    </div>
    
    ${blogPostsHtml}
    
    <div class="blog-post" style="text-align: center; color: #888; font-size: 12px;">
        使用像素博客整理器生成
    </div>
    
    <script>
        // 添加简单的搜索功能
        const posts = document.querySelectorAll('.blog-post');
        const searchDiv = document.createElement('div');
        searchDiv.innerHTML = '<input type="text" placeholder="搜索博客内容..." style="width: 100%; padding: 10px; margin: 20px 0; border: 1px solid #ddd; border-radius: 4px; font-family: monospace;">';
        document.querySelector('.header').after(searchDiv);
        
        const searchInput = searchDiv.querySelector('input');
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            posts.forEach(post => {
                const content = post.textContent.toLowerCase();
                post.style.display = content.includes(searchTerm) ? 'block' : 'none';
            });
        });
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
            
            // 尝试从script标签中提取数据
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
            
            // 如果script中没有找到，尝试从页面内容中解析
            if (importedBlogs.length === 0) {
                const posts = doc.querySelectorAll('.blog-post');
                importedBlogs = Array.from(posts).map((post, index) => {
                    const header = post.querySelector('.post-header');
                    const dateText = header ? header.textContent : '';
                    const content = post.querySelector('.post-content')?.textContent || '';
                    const tags = Array.from(post.querySelectorAll('.tag')).map(tag => tag.textContent);
                    
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
                
                // 提取所有标签
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