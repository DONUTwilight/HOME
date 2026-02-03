// 修改后的JavaScript - 适配新布局
document.addEventListener('DOMContentLoaded', function() {
    // 全局变量
    let records = JSON.parse(localStorage.getItem('mediaRecords')) || [];
    let editingId = null;
    
    // 页面元素引用
    const recordForm = document.getElementById('record-form');
    const recordsList = document.getElementById('records-list');
    const filterButtons = document.getElementById('filter-buttons');
    const statsContainer = document.getElementById('stats');
    const emptyState = document.getElementById('empty-state');
    
    // 初始化
    initApp();
    
    function initApp() {
        // 设置默认日期为今天
        document.getElementById('date').valueAsDate = new Date();
        
        // 绑定事件
        bindEvents();
        
		    document.getElementById('choose-image').addEventListener('click', function() {
        document.getElementById('image-url').click();
    });
	
	    document.getElementById('image-url').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            document.getElementById('file-name').textContent = '已选择: ' + e.target.files[0].name;
        } else {
            document.getElementById('file-name').textContent = '';
        }
    });

		
        // 渲染初始数据
        updateStats();
        renderRecords('all');
    }
    
    function bindEvents() {
        // 表单提交
        recordForm.addEventListener('submit', handleFormSubmit);
        
        // 重置表单
        document.getElementById('reset-form').addEventListener('click', resetForm);
        
        // 筛选按钮
        filterButtons.addEventListener('click', handleFilterClick);
        
        // 导出功能
        document.getElementById('export-json').addEventListener('click', exportJSON);
        document.getElementById('export-html').addEventListener('click', exportHTML);
        document.getElementById('clear-data').addEventListener('click', clearData);
		document.getElementById('import-json').addEventListener('click', importJSON);
    }
    
function handleFormSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const type = document.getElementById('type').value;
    const director = document.getElementById('director').value.trim();
    const date = document.getElementById('date').value;
    const rating = document.getElementById('rating').value;
    const notes = document.getElementById('notes').value.trim();
    
    // 获取图片文件
    const imageFile = document.getElementById('image-url').files[0];
    
    if (!title || !type || !date) {
        alert('请填写必填字段（标题、类型、日期）');
        return;
    }
    
    // 处理图片 - 转换成base64格式
    let imageUrl = '';
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // 把图片转换成base64格式
            imageUrl = e.target.result;
            
            // 创建记录对象（包含图片）
            createRecord(imageUrl);
        };
        reader.readAsDataURL(imageFile);
    } else {
        // 如果没有选择图片，使用空字符串
        createRecord('');
    }
    
    // 创建记录的函数
    function createRecord(imageUrl) {
        const record = {
            id: editingId || Date.now().toString(),
            title,
            type,
            director: director || '',
            date,
            rating: rating || null,
            notes: notes || '',
            image: imageUrl || '',
            createdAt: editingId ? getRecordById(editingId).createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // ... 后面保存和显示记录的代码不变 ...
        // 注意：这部分代码需要放在createRecord函数内部
        if (editingId) {
            // 更新记录
            const index = records.findIndex(r => r.id === editingId);
            if (index !== -1) {
                records[index] = record;
            }
            editingId = null;
            document.querySelector('#record-form .btn-primary').textContent = '添加记录';
        } else {
            // 添加新记录
            records.unshift(record);
        }
        
        // 保存数据
        saveRecords();
        
        // 重置表单
        resetForm();
        
        // 更新UI
        updateStats();
        renderRecords(getActiveFilter());
        
        // 显示成功消息
        showMessage(editingId ? '记录已更新！' : '记录已添加！');
    }
}
    
	function resetForm() {
		recordForm.reset();
		document.getElementById('date').valueAsDate = new Date();
		editingId = null;
		document.querySelector('#record-form .btn-primary').textContent = '添加记录';
		// 清除文件名显示
		document.getElementById('file-name').textContent = '';
	}
		
    function handleFilterClick(e) {
        if (e.target.classList.contains('filter-tab')) {
            // 更新活动标签
            document.querySelectorAll('.filter-tab').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            // 渲染记录
            const filter = e.target.dataset.filter;
            renderRecords(filter);
        }
    }
    
    function renderRecords(filter) {
        // 获取排序后的记录（按时间倒序）
        let sortedRecords = [...records].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        // 应用筛选
        let filteredRecords = sortedRecords;
        if (filter !== 'all') {
            filteredRecords = sortedRecords.filter(record => record.type === filter);
        }
        
        // 检查是否为空
        if (filteredRecords.length === 0) {
            recordsList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // 生成记录列表HTML - 新布局
        const recordsHTML = filteredRecords.map(record => {
            // 生成评分星星
            const ratingStars = generateStars(record.rating);
            
            return `
            <div class="record-card" data-id="${record.id}">
                <!-- 左侧图片 -->
                <div class="record-image-container">
                    ${record.image ? 
                        `<img src="${record.image}" class="record-image" alt="${record.title}">` : 
                        `<div style="width:100%;height:100%;background:var(--color-border);display:flex;align-items:center;justify-content:center;color:var(--color-text-tertiary);font-size:0.9rem;">无封面</div>`
                    }
                </div>
                
                <!-- 右侧信息 -->
                <div class="record-info">
                    <!-- 类型标签 -->
                    <span class="record-type-badge ${record.type}">${getTypeLabel(record.type)}</span>
                    
                    <!-- 片名 -->
                    <h3 class="record-title">${record.title}</h3>
                    
                    <!-- 导演/作者 -->
                    ${record.director ? `
                        <div class="record-director">
                            <span class="director-label">导演/作者：</span>
                            <span>${record.director}</span>
                        </div>
                    ` : ''}
                    
                    <!-- 评分 -->
                    ${record.rating ? `
                        <div class="record-rating-container">
                            <div class="rating-stars">${ratingStars}</div>
                            <span class="rating-value">${record.rating}</span>
                            <span class="rating-out-of">/10</span>
                        </div>
                    ` : ''}
                    
                    <!-- 分隔线 -->
                    <div class="record-divider"></div>
                    
                    <!-- 元信息 -->
                    <div class="record-meta-info">
                        <div class="meta-item">
                            <span>📅</span>
                            <span>${formatDate(record.date)}</span>
                        </div>
                        <div class="meta-item">
                            <span>⏰</span>
                            <span>${formatTime(record.createdAt)}</span>
                        </div>
                    </div>
                    
                    <!-- 影评/备注 -->
                    ${record.notes ? `
                        <div class="record-review">
                            <div class="review-label">Notes：</div>
                            <div>${record.notes}</div>
                        </div>
                    ` : ''}
                    
                    <!-- 操作按钮 -->
                    <div class="record-actions">
                        <button class="btn btn-secondary edit-record" data-id="${record.id}">编辑</button>
                        <button class="btn btn-danger delete-record" data-id="${record.id}">删除</button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
        recordsList.innerHTML = recordsHTML;
        
        // 绑定编辑和删除按钮事件
        document.querySelectorAll('.edit-record').forEach(btn => {
            btn.addEventListener('click', function() {
                editRecord(this.dataset.id);
            });
        });
        
        document.querySelectorAll('.delete-record').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteRecord(this.dataset.id);
            });
        });
    }
    
    function updateStats() {
        const counts = {
            all: records.length,
            movie: records.filter(r => r.type === 'movie').length,
            tv: records.filter(r => r.type === 'tv').length,
            documentary: records.filter(r => r.type === 'documentary').length,
            book: records.filter(r => r.type === 'book').length
        };
        
        statsContainer.innerHTML = `
            <div class="stat-box">
                <div class="stat-label">总计</div>
                <div class="stat-value">${counts.all}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">电影</div>
                <div class="stat-value">${counts.movie}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">电视剧</div>
                <div class="stat-value">${counts.tv}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">纪录片</div>
                <div class="stat-value">${counts.documentary}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">书籍</div>
                <div class="stat-value">${counts.book}</div>
            </div>
        `;
    }
    
    function editRecord(id) {
        const record = getRecordById(id);
        if (!record) return;
        
        // 填充表单
        document.getElementById('title').value = record.title;
        document.getElementById('type').value = record.type;
        document.getElementById('director').value = record.director || '';
        document.getElementById('date').value = record.date;
        document.getElementById('rating').value = record.rating || '';
        document.getElementById('notes').value = record.notes;
        document.getElementById('image-url').value = record.image || '';
        
        // 设置编辑模式
        editingId = id;
        document.querySelector('#record-form .btn-primary').textContent = '更新记录';
        
        // 滚动到表单
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    }
    
    function deleteRecord(id) {
        if (!confirm('确定要删除这条记录吗？')) return;
        
        records = records.filter(record => record.id !== id);
        saveRecords();
        
        updateStats();
        renderRecords(getActiveFilter());
        
        showMessage('记录已删除！');
    }
    
	function exportJSON() {
		// 在导出JSON之前，按观看日期(date)从新到旧排序
		const sortedRecords = [...records].sort((a, b) => 
			new Date(b.date) - new Date(a.date)  // 改为按date排序
		);
		
		const dataStr = JSON.stringify(sortedRecords, null, 2);  // 导出排序后的
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		
		const url = URL.createObjectURL(dataBlob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `我的记录-按观看时间排序-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		
		showMessage('JSON数据已导出（按观看时间排序）！');
	}    
	
	function exportHTML() {
		// 获取排序后的记录（按观看日期倒序 - 从新到旧）
		const sortedRecords = [...records].sort((a, b) => 
			new Date(b.date) - new Date(a.date)  // 改为按date排序
		);
		
		// 生成HTML页面内容
		const htmlContent = `<!DOCTYPE html>
	<html lang="zh-CN">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>我的记录（按观看时间排序）</title>
		<style>
			:root {
				--color-bg: #0A0F2B;
				--color-surface: #121835;
				--color-surface-secondary: #1A2240;
				--color-text-primary: #E6F0FF;
				--color-text-secondary: #C8D8FF;
				--color-text-tertiary: #A5B8E9;
				--color-primary: #4169E1;
				--color-accent: #FF8C00;
				--color-secondary: #4682B4;
				--color-success: #32CD32;
				--color-donut: #FF8C00;
				--color-border: #2A3258;
			}
			
			body {
				background-color: var(--color-bg);
				color: var(--color-text-primary);
				font-family: 'Times New Roman', Times, serif;
				line-height: 1.6;
				padding: 20px;
			}
			
			.container {
				max-width: 1000px;
				margin: 0 auto;
			}
			
			header {
				text-align: center;
				margin-bottom: 40px;
				padding-bottom: 20px;
				border-bottom: 1px solid var(--color-border);
			}
			
			h1 {
				color: var(--color-text-primary);
				font-size: 2.5rem;
				margin-bottom: 10px;
			}
			
			.stats-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
				gap: 15px;
				margin-bottom: 30px;
			}
			
			.stat-box {
				background: var(--color-surface-secondary);
				border: 1px solid var(--color-border);
				border-radius: 8px;
				padding: 15px;
				text-align: center;
			}
			
			.stat-value {
				color: var(--color-accent);
				font-size: 1.5rem;
				font-weight: 600;
			}
			
			.records-container {
				display: flex;
				flex-direction: column;
				gap: 25px;
			}
			
			.record-card {
				background: var(--color-surface-secondary);
				border: 1px solid var(--color-border);
				border-radius: 12px;
				padding: 25px;
				display: grid;
				grid-template-columns: 180px 1fr;
				gap: 25px;
			}
			
			.record-image-container {
				width: 180px;
				height: 270px;
				border-radius: 8px;
				overflow: hidden;
				border: 1px solid var(--color-border);
			}
			
			.record-image {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
			
			.record-title {
				font-size: 1.6rem;
				font-weight: 600;
				color: var(--color-text-primary);
				margin-bottom: 8px;
			}
			
			.record-director {
				color: var(--color-text-secondary);
				font-size: 1.1rem;
				margin-bottom: 8px;
			}
			
			.record-rating-container {
				display: flex;
				align-items: center;
				gap: 8px;
				margin-bottom: 20px;
			}
			
			.rating-value {
				color: var(--color-donut);
				font-weight: 600;
				font-size: 1.1rem;
			}
			
			.record-divider {
				height: 1px;
				background: var(--color-border);
				margin: 20px 0;
			}
			
			.record-review {
				color: var(--color-text-secondary);
				line-height: 1.6;
				padding: 15px;
				background: rgba(255, 255, 255, 0.05);
				border-radius: 8px;
				border-left: 3px solid var(--color-accent);
			}
		</style>
	</head>
	<body>
		<div class="container">
			<header>
				<h1>我的记录（按观看时间排序）</h1>
				<p>共 ${records.length} 条记录，按观看时间从新到旧排序，最后更新: ${new Date().toLocaleDateString('zh-CN')}</p>
			</header>
			
			<div class="stats-grid">
				<div class="stat-box">
					电影 <div class="stat-value">${records.filter(r => r.type === 'movie').length}</div>
				</div>
				<div class="stat-box">
					电视剧 <div class="stat-value">${records.filter(r => r.type === 'tv').length}</div>
				</div>
				<div class="stat-box">
					纪录片 <div class="stat-value">${records.filter(r => r.type === 'documentary').length}</div>
				</div>
				<div class="stat-box">
					书籍 <div class="stat-value">${records.filter(r => r.type === 'book').length}</div>
				</div>
			</div>
			
			<div class="records-container">
				${sortedRecords.map(record => {
					const ratingStars = generateStars(record.rating);
					return `
					<div class="record-card">
						<div class="record-image-container">
							${record.image ? 
								`<img src="${record.image}" class="record-image" alt="${record.title}">` : 
								`<div style="width:100%;height:100%;background:var(--color-border);display:flex;align-items:center;justify-content:center;color:var(--color-text-tertiary);">无封面</div>`
							}
						</div>
						
						<div class="record-info">
							<h3 class="record-title">${record.title}</h3>
							
							${record.director ? `
								<div class="record-director">
									<span>导演/作者：${record.director}</span>
								</div>
							` : ''}
							
							${record.rating ? `
								<div class="record-rating-container">
									<div class="rating-stars">${ratingStars}</div>
									<span class="rating-value">${record.rating}</span>
									<span>/10</span>
								</div>
							` : ''}
							
							<div class="record-divider"></div>
							
							<div style="color:var(--color-text-tertiary);margin-bottom:10px;">
								📅 ${formatDate(record.date)}
							</div>
							
							${record.notes ? `
								<div class="record-review">
									${record.notes}
								</div>
							` : ''}
						</div>
					</div>
					`;
				}).join('')}
			</div>
		</div>
	</body>
	</html>`;
		
		const dataBlob = new Blob([htmlContent], { type: 'text/html' });
		const url = URL.createObjectURL(dataBlob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `我的记录-按观看时间排序-${new Date().toISOString().split('T')[0]}.html`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		
		showMessage('HTML页面已导出（按观看时间排序）！');
	}
    
    function clearData() {
        if (!confirm('确定要清除所有数据吗？此操作不可撤销！')) return;
        
        records = [];
        saveRecords();
        
        updateStats();
        renderRecords('all');
        
        showMessage('所有数据已清除！');
    }
    
    // 辅助函数
    function saveRecords() {
        localStorage.setItem('mediaRecords', JSON.stringify(records));
    }
    
    function getRecordById(id) {
        return records.find(record => record.id === id);
    }
    
    function getActiveFilter() {
        return document.querySelector('.filter-tab.active').dataset.filter;
    }
    
    function getTypeLabel(type) {
        const labels = {
            movie: '电影',
            tv: '电视剧',
            documentary: '纪录片',
            book: '书籍'
        };
        return labels[type] || type;
    }
    
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }
    
    function formatTime(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    function generateStars(rating) {
        if (!rating) return '';
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 10 - fullStars - (halfStar ? 1 : 0);
        
        let stars = '★'.repeat(fullStars);
        if (halfStar) stars += '☆';
        stars += '☆'.repeat(emptyStars);
        
        return stars;
    }
    
    function showMessage(text) {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.textContent = text;
        messageEl.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 24px;
            background: var(--color-accent);
            color: white;
            border-radius: 8px;
            font-size: 0.95rem;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        `;
        
        document.body.appendChild(messageEl);
        
        // 3秒后移除
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 3000);
    }
	
		// 最简单的JSON导入功能
	function importJSON() {
		// 创建隐藏的文件输入框
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.style.display = 'none';
		
		// 当用户选择了文件
		input.onchange = function(e) {
			const file = e.target.files[0];
			if (!file) return;
			
			const reader = new FileReader();
			reader.onload = function(e) {
				try {
					// 直接替换数据
					records = JSON.parse(e.target.result);
					saveRecords();
					updateStats();
					renderRecords('all');
					showMessage('数据导入成功！');
				} catch {
					alert('文件格式错误！请选择正确的JSON文件');
				}
			};
			reader.readAsText(file);
		};
		
		// 触发文件选择
		input.click();
	}
	
	
});