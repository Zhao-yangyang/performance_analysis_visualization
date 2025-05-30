// 成绩分析可视化应用主文件
class GradeAnalyzer {
    constructor() {
        this.data = [];
        this.charts = {};
        this.manualData = []; // 用于手动输入时暂存数据
        this.editingStudentIndex = null; // 新增：跟踪正在编辑的学生索引
        this.subjects = ['语文', '数学', '英语', '物理', '化学']; // 默认科目列表
        this.currentGradeDetailData = null; // 存储当前等级详情数据
        this.init();
    }

    init() {
        this.bindEvents();
        this.initDarkMode();
        this.initGradeDetailModal(); // 初始化等级详情模态框
        this.showSection('data-input-section');
    }

    bindEvents() {
        // 文件输入事件
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });

        // 手动输入按钮
        document.getElementById('manualInputBtn').addEventListener('click', () => {
            this.showManualInputModal();
        });

        // 加载示例数据按钮
        document.getElementById('loadSampleBtn').addEventListener('click', () => {
            this.loadSampleData();
        });

        // 下载示例CSV按钮
        document.getElementById('downloadSampleBtn').addEventListener('click', () => {
            this.downloadSampleCSV();
        });

        // 开始分析按钮
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.showAnalysisOptions();
        });

        // 生成图表按钮
        document.getElementById('generateChartsBtn').addEventListener('click', () => {
            this.generateCharts();
        });

        // 模态框相关事件
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideManualInputModal();
        });

        document.getElementById('addStudentBtn').addEventListener('click', () => {
            this.addStudent();
        });

        document.getElementById('finishInputBtn').addEventListener('click', () => {
            this.finishManualInput();
        });

        // 分析选项模态框事件
        document.getElementById('closeAnalysisModal').addEventListener('click', () => {
            this.hideAnalysisOptionsModal();
        });

        // 科目管理事件
        document.getElementById('addSubjectBtn').addEventListener('click', () => {
            this.addNewSubject();
        });

        document.getElementById('newSubjectInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addNewSubject();
            }
        });

        // 图表控制按钮
        document.getElementById('refreshChartsBtn').addEventListener('click', () => {
            this.refreshCharts();
        });

        // 导出和打印按钮
        document.getElementById('saveImageBtn').addEventListener('click', () => {
            this.saveChartsAsImages();
        });

        // 数据管理按钮
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.clearData();
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideManualInputModal();
                this.hideAnalysisOptionsModal();
            }
        });

        // 暗黑模式切换
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });

        // 文件拖拽事件
        this.setupFileDragDrop();
    }

    showSection(sectionId) {
        // 隐藏所有section
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.style.display = 'none';
        });

        // 显示目标section
        const targetSection = document.querySelector(`.${sectionId}`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let csvData = e.target.result;
                
                // 检测并处理BOM
                if (csvData.charCodeAt(0) === 0xFEFF) {
                    csvData = csvData.slice(1); // 移除BOM
                }
                
                this.data = this.parseCSV(csvData);
                // this.subjects 在 parseCSV 中已经设置
                this.displayDataPreview();
                this.showSection('data-preview-section');
                this.showToast(`成功加载 ${this.data.length} 条数据，识别到 ${this.subjects.length} 个科目`, 'success');
            } catch (error) {
                // 如果UTF-8解析失败，尝试使用GBK编码
                this.handleFileWithFallbackEncoding(file);
            }
        };
        
        reader.onerror = () => {
            this.showToast('文件读取失败，请检查文件是否损坏', 'error');
        };
        
        reader.readAsText(file, 'UTF-8');
    }

    // 新增：处理编码回退的文件读取
    handleFileWithFallbackEncoding(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                // 尝试将ArrayBuffer转换为GBK编码的文本
                const uint8Array = new Uint8Array(e.target.result);
                let csvData = this.decodeGBK(uint8Array);
                
                this.data = this.parseCSV(csvData);
                this.displayDataPreview();
                this.showSection('data-preview-section');
                this.showToast(`成功加载 ${this.data.length} 条数据，识别到 ${this.subjects.length} 个科目 (GBK编码)`, 'success');
            } catch (error) {
                this.showToast('文件格式不正确或编码不支持，请检查CSV文件格式！建议使用UTF-8编码保存CSV文件', 'error');
                console.error('CSV解析错误:', error);
            }
        };
        
        reader.onerror = () => {
            this.showToast('文件读取失败，请检查文件是否损坏', 'error');
        };
        
        reader.readAsArrayBuffer(file);
    }

    // 新增：简单的GBK解码器（适用于常见中文字符）
    decodeGBK(uint8Array) {
        let result = '';
        try {
            // 尝试使用TextDecoder（现代浏览器支持）
            const decoder = new TextDecoder('gbk');
            result = decoder.decode(uint8Array);
        } catch (e) {
            // 回退到基本的字符解码
            for (let i = 0; i < uint8Array.length; i++) {
                const byte = uint8Array[i];
                if (byte < 128) {
                    // ASCII字符
                    result += String.fromCharCode(byte);
                } else {
                    // 对于非ASCII字符，使用简单的处理
                    // 这里可能不完美，但对于基本的CSV应该足够
                    result += String.fromCharCode(byte);
                }
            }
        }
        return result;
    }

    parseCSV(csvText) {
        // 预处理CSV文本
        csvText = csvText.trim();
        
        // 检测分隔符（支持逗号、分号、制表符）
        const separators = [',', ';', '\t'];
        let separator = ',';
        let maxColumns = 0;
        
        for (const sep of separators) {
            const testLines = csvText.split('\n').slice(0, 3); // 测试前3行
            let columnCount = 0;
            for (const line of testLines) {
                const cols = line.split(sep).length;
                columnCount = Math.max(columnCount, cols);
            }
            if (columnCount > maxColumns) {
                maxColumns = columnCount;
                separator = sep;
            }
        }

        console.log(`检测到CSV分隔符: "${separator === '\t' ? '制表符' : separator}"`);
        
        // 分割行并过滤空行
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('CSV文件至少需要包含表头和一行数据');
        }

        // 解析表头
        const headers = this.parseCSVLine(lines[0], separator).map(h => h.trim());
        const data = [];

        // 提取科目列表（排除姓名相关的列）
        this.subjects = headers.filter(header => 
            !['姓名', 'name', '学生姓名', 'Name', 'NAME', '学生'].includes(header)
        );

        // 解析数据行
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // 跳过空行
            
            const values = this.parseCSVLine(line, separator).map(v => v.trim());
            
            // 验证数据行的有效性
            if (values.length !== headers.length) {
                console.warn(`第${i + 1}行数据列数不匹配，跳过: ${line}`);
                continue;
            }

            // 检查是否是有效的学生数据行
            const nameValue = values[0];
            if (!nameValue || nameValue.includes('说明') || nameValue.includes('当前') || nameValue.includes('支持')) {
                console.warn(`第${i + 1}行不是有效的学生数据，跳过: ${line}`);
                continue;
            }

            // 检查科目分数是否为有效数字
            let hasValidScores = false;
            for (let j = 1; j < values.length; j++) {
                const score = parseFloat(values[j]);
                if (!isNaN(score) && score >= 0 && score <= 100) {
                    hasValidScores = true;
                    break;
                }
            }

            if (!hasValidScores) {
                console.warn(`第${i + 1}行没有有效的分数数据，跳过: ${line}`);
                continue;
            }

            // 构建学生数据对象
            const row = {};
            headers.forEach((header, index) => {
                if (['姓名', 'name', '学生姓名', 'Name', 'NAME', '学生'].includes(header)) {
                    row[header] = values[index];
                } else {
                    const score = parseFloat(values[index]);
                    row[header] = isNaN(score) ? 0 : Math.max(0, Math.min(100, score)); // 限制在0-100范围内
                }
            });
            data.push(row);
        }

        if (data.length === 0) {
            throw new Error('CSV文件中没有找到有效的学生数据');
        }

        console.log(`成功解析 ${data.length} 条学生数据，${this.subjects.length} 个科目`);
        return data;
    }

    // 新增：解析CSV行，处理引号包围的字段
    parseCSVLine(line, separator = ',') {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // 双引号转义
                    current += '"';
                    i += 2;
                } else {
                    // 切换引号状态
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === separator && !inQuotes) {
                // 分隔符（不在引号内）
                result.push(current);
                current = '';
                i++;
            } else {
                // 普通字符
                current += char;
                i++;
            }
        }

        // 添加最后一个字段
        result.push(current);
        
        return result;
    }

    // 新增：从数据中提取科目列表的方法
    getSubjectsFromData(data) {
        if (!data || data.length === 0) return [];
        const headers = Object.keys(data[0]);
        return headers.filter(header => 
            !['姓名', 'name', '学生姓名', 'Name', 'NAME', '学生'].includes(header)
        );
    }

    loadSampleData() {
        this.data = [
            { '姓名': '张三', '语文': 85, '数学': 92, '英语': 78, '物理': 88, '化学': 83 },
            { '姓名': '李四', '语文': 79, '数学': 85, '英语': 91, '物理': 76, '化学': 89 },
            { '姓名': '王五', '语文': 92, '数学': 78, '英语': 85, '物理': 93, '化学': 87 },
            { '姓名': '赵六', '语文': 88, '数学': 94, '英语': 82, '物理': 85, '化学': 91 },
            { '姓名': '钱七', '语文': 76, '数学': 81, '英语': 88, '物理': 79, '化学': 84 },
            { '姓名': '孙八', '语文': 94, '数学': 87, '英语': 93, '物理': 91, '化学': 88 },
            { '姓名': '周九', '语文': 82, '数学': 89, '英语': 76, '物理': 84, '化学': 86 },
            { '姓名': '吴十', '语文': 87, '数学': 83, '英语': 89, '物理': 87, '化学': 82 },
            { '姓名': '陈一', '语文': 95, '数学': 98, '英语': 92, '物理': 96, '化学': 94 },
            { '姓名': '郑二', '语文': 90, '数学': 91, '英语': 97, '物理': 90, '化学': 93 },
            { '姓名': '冯三', '语文': 75, '数学': 72, '英语': 78, '物理': 70, '化学': 74 },
            { '姓名': '褚四', '语文': 68, '数学': 75, '英语': 70, '物理': 72, '化学': 69 },
            { '姓名': '卫五', '语文': 80, '数学': 65, '英语': 73, '物理': 78, '化学': 77 },
            { '姓名': '蒋六', '语文': 55, '数学': 62, '英语': 58, '物理': 50, '化学': 59 },
            { '姓名': '沈七', '语文': 48, '数学': 55, '英语': 40, '物理': 52, '化学': 45 },
            { '姓名': '韩八', '语文': 63, '数学': 50, '英语': 59, '物理': 48, '化学': 53 },
            { '姓名': '杨九', '语文': 98, '数学': 60, '英语': 95, '物理': 55, '化学': 58 },
            { '姓名': '朱十', '语文': 65, '数学': 99, '英语': 62, '物理': 97, '化学': 90 },
            { '姓名': '秦十一', '语文': 70, '数学': 71, '英语': 68, '物理': 67, '化学': 72 },
            { '姓名': '尤十二', '语文': 66, '数学': 69, '英语': 72, '物理': 65, '化学': 68 }
        ];
        
        // 设置科目列表
        this.subjects = this.getSubjectsFromData(this.data);
        
        this.displayDataPreview();
        this.showSection('data-preview-section');
        this.showToast(`加载示例数据成功：${this.data.length} 名学生，${this.subjects.length} 个科目`, 'success');
    }

    displayDataPreview() {
        if (this.data.length === 0) return;

        // 更新统计信息
        const studentCount = this.data.length;
        const subjectCount = Object.keys(this.data[0]).length - 1; // 减去姓名列
        const allScores = this.getAllScores();
        const averageScore = (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1);
        const maxScore = Math.max(...allScores);
        const minScore = Math.min(...allScores);

        document.getElementById('studentCount').textContent = studentCount;
        document.getElementById('subjectCount').textContent = subjectCount;
        document.getElementById('averageScore').textContent = averageScore;
        document.getElementById('maxScore').textContent = maxScore;
        document.getElementById('minScore').textContent = minScore;

        // 更新头部统计信息
        this.updateHeaderStats();

        // 显示数据表格
        this.renderDataTable();

        // 显示数据预览区域
        document.getElementById('dataPreviewSection').style.display = 'block';
    }

    getAllScores() {
        const scores = [];
        this.data.forEach(student => {
            Object.keys(student).forEach(key => {
                if (!['姓名', 'name', '学生姓名', 'Name', 'NAME', '学生'].includes(key)) {
                    scores.push(student[key]);
                }
            });
        });
        return scores;
    }

    renderDataTable() {
        const table = document.getElementById('dataTable');
        const thead = document.getElementById('tableHead');
        const tbody = document.getElementById('tableBody');

        if (!this.data || this.data.length === 0) {
            thead.innerHTML = '<tr><th>没有数据</th></tr>';
            tbody.innerHTML = '';
            return;
        }

        // 清空表格
        thead.innerHTML = '';
        tbody.innerHTML = '';

        // 计算每个学生的总分和平均分，并按总分排序
        const studentsWithScores = this.data.map((student, originalIndex) => {
            const headers = Object.keys(student);
            let total = 0;
            let subjectCount = 0;

            headers.forEach(header => {
                if (!['姓名', 'name', '学生姓名', 'Name', 'NAME', '学生'].includes(header)) {
                    total += parseFloat(student[header]) || 0;
                    subjectCount++;
                }
            });

            return {
                ...student,
                originalIndex,
                total,
                average: subjectCount > 0 ? (total / subjectCount).toFixed(1) : 'N/A'
            };
        }).sort((a, b) => b.total - a.total); // 按总分从高到低排序

        // 生成表头
        const headers = Object.keys(this.data[0]);
        const headerRow = document.createElement('tr');
        
        // 添加排名列
        const rankTh = document.createElement('th');
        rankTh.textContent = '排名';
        rankTh.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        rankTh.style.color = 'white';
        headerRow.appendChild(rankTh);
        
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        
        const fixedHeaders = ['总分', '平均分', '操作'];
        fixedHeaders.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);

        // 生成表格内容
        studentsWithScores.forEach((student, index) => {
            const row = document.createElement('tr');
            const rank = index + 1;
            
            // 为前三名添加特殊样式
            if (rank === 1) {
                row.classList.add('rank-first');
                row.setAttribute('title', '🥇 第一名');
            } else if (rank === 2) {
                row.classList.add('rank-second');
                row.setAttribute('title', '🥈 第二名');
            } else if (rank === 3) {
                row.classList.add('rank-third');
                row.setAttribute('title', '🥉 第三名');
            }

            // 添加排名列
            const rankTd = document.createElement('td');
            let rankContent = rank;
            if (rank === 1) rankContent = '🥇 1';
            else if (rank === 2) rankContent = '🥈 2';
            else if (rank === 3) rankContent = '🥉 3';
            
            rankTd.innerHTML = `<span class="rank-number">${rankContent}</span>`;
            rankTd.style.fontWeight = 'bold';
            rankTd.style.textAlign = 'center';
            row.appendChild(rankTd);

            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = student[header];
                row.appendChild(td);
            });

            // 添加总分
            const totalTd = document.createElement('td');
            totalTd.textContent = student.total;
            totalTd.style.fontWeight = 'bold';
            totalTd.style.color = '#667eea';
            row.appendChild(totalTd);

            // 添加平均分
            const avgTd = document.createElement('td');
            avgTd.textContent = student.average;
            avgTd.style.fontWeight = 'bold';
            avgTd.style.color = '#764ba2';
            row.appendChild(avgTd);

            // 添加操作按钮（编辑）
            const actionTd = document.createElement('td');
            const editBtn = document.createElement('button');
            editBtn.textContent = '编辑';
            editBtn.className = 'btn btn-secondary btn-small';
            editBtn.addEventListener('click', () => this.startEditStudent(student.originalIndex));
            actionTd.appendChild(editBtn);
            row.appendChild(actionTd);

            tbody.appendChild(row);
        });
    }

    // 新增：动态生成表单字段
    generateDynamicForm() {
        const formContainer = document.getElementById('dynamicInputForm');
        formContainer.innerHTML = '';

        // 学生姓名字段（固定）
        const nameGroup = document.createElement('div');
        nameGroup.className = 'form-group';
        nameGroup.innerHTML = `
            <label>学生姓名:</label>
            <input type="text" id="studentName" placeholder="输入学生姓名">
        `;
        formContainer.appendChild(nameGroup);

        // 科目字段（动态生成）
        if (this.subjects.length > 0) {
            // 每两个科目一行
            for (let i = 0; i < this.subjects.length; i += 2) {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'form-row';

                // 第一个科目
                const subject1 = this.subjects[i];
                const group1 = document.createElement('div');
                group1.className = 'form-group';
                group1.innerHTML = `
                    <label>${subject1}:</label>
                    <input type="number" id="subject_${i}" data-subject="${subject1}" placeholder="输入成绩" min="0" max="100">
                `;
                rowDiv.appendChild(group1);

                // 第二个科目（如果存在）
                if (i + 1 < this.subjects.length) {
                    const subject2 = this.subjects[i + 1];
                    const group2 = document.createElement('div');
                    group2.className = 'form-group';
                    group2.innerHTML = `
                        <label>${subject2}:</label>
                        <input type="number" id="subject_${i + 1}" data-subject="${subject2}" placeholder="输入成绩" min="0" max="100">
                    `;
                    rowDiv.appendChild(group2);
                }

                formContainer.appendChild(rowDiv);
            }
        } else {
            // 如果没有科目数据，使用默认科目
            this.subjects = ['语文', '数学', '英语', '物理', '化学'];
            this.generateDynamicForm(); // 递归调用生成表单
            return;
        }
    }

    // 新增：从动态表单获取学生数据
    getStudentDataFromForm() {
        const name = document.getElementById('studentName').value.trim();
        if (!name) return null;

        const student = { '姓名': name };
        
        // 获取所有科目的分数
        this.subjects.forEach((subject, index) => {
            const input = document.getElementById(`subject_${index}`);
            if (input) {
                student[subject] = parseFloat(input.value) || 0;
            }
        });

        return student;
    }

    // 新增：向动态表单填充学生数据
    fillFormWithStudentData(studentData) {
        // 填充姓名（支持多种姓名字段格式）
        const nameField = document.getElementById('studentName');
        if (nameField) {
            const nameValue = studentData['姓名'] || studentData['name'] || studentData['学生姓名'] || 
                             studentData['Name'] || studentData['NAME'] || studentData['学生'] || '';
            nameField.value = nameValue;
        }

        // 填充科目分数
        this.subjects.forEach((subject, index) => {
            const input = document.getElementById(`subject_${index}`);
            if (input && studentData[subject] !== undefined) {
                input.value = studentData[subject];
            }
        });
    }

    // 新增：清空动态表单
    clearDynamicForm() {
        const nameField = document.getElementById('studentName');
        if (nameField) nameField.value = '';

        this.subjects.forEach((subject, index) => {
            const input = document.getElementById(`subject_${index}`);
            if (input) input.value = '';
        });
    }

    startEditStudent(index) {
        this.editingStudentIndex = index;
        const studentData = this.data[index];

        // 生成动态表单
        this.generateDynamicForm();
        
        // 填充数据
        this.fillFormWithStudentData(studentData);
        
        // 更新模态框按钮和标题
        document.querySelector('#manualInputModal .modal-header h3').textContent = '编辑学生成绩';
        document.getElementById('addStudentBtn').textContent = '更新信息';
        document.getElementById('finishInputBtn').textContent = '取消编辑';

        this.showManualInputModal(true, false);
    }

    showManualInputModal(isEditMode = false, shouldClearManualData = true) {
        document.getElementById('manualInputModal').style.display = 'flex';
        
        if (!isEditMode) { // 普通添加模式
            if (shouldClearManualData) {
                this.manualData = [];
            }
            
            // 显示科目管理区域
            document.getElementById('subjectManagement').style.display = 'block';
            
            // 渲染科目列表
            this.renderSubjectsList();
            
            // 生成动态表单
            this.generateDynamicForm();
            // 清空表单
            this.clearDynamicForm();
            
            // 重置模态框按钮和标题为默认添加状态
            document.querySelector('#manualInputModal .modal-header h3').textContent = '手动输入成绩数据';
            document.getElementById('addStudentBtn').textContent = '添加学生';
            document.getElementById('finishInputBtn').textContent = '完成输入';
        } else {
            // 编辑模式隐藏科目管理
            document.getElementById('subjectManagement').style.display = 'none';
        }
        // 编辑模式的表单生成在 startEditStudent 中处理
    }

    hideManualInputModal() {
        document.getElementById('manualInputModal').style.display = 'none';
    }

    addStudent() {
        const student = this.getStudentDataFromForm();
        
        if (!student) {
            this.showToast('请输入学生姓名！', 'error');
            return;
        }

        if (this.editingStudentIndex !== null) {
            // 更新模式
            this.data[this.editingStudentIndex] = student;
            this.showToast('学生信息已更新', 'success');
            this.editingStudentIndex = null;
            this.hideManualInputModal();
            this.renderDataTable();
            this.updateHeaderStats();
        } else {
            // 添加模式
            if (!this.manualData) this.manualData = [];
            this.manualData.push(student);
            this.showToast('学生已添加到列表', 'success');
            
            // 清空表单以便连续添加
            this.clearDynamicForm();
            document.getElementById('studentName').focus();
        }
    }

    finishManualInput() { // 这个方法现在处理"完成输入"和"取消编辑"
        if (this.editingStudentIndex !== null) {
            // 取消编辑模式
            this.showToast('编辑已取消', 'info');
            this.editingStudentIndex = null; // 重置编辑状态
            this.hideManualInputModal();
        } else {
            // 完成（批量）添加模式
            if (!this.manualData || this.manualData.length === 0) {
                this.showToast('没有手动输入的数据。', 'warning');
                this.hideManualInputModal(); // 仍然关闭模态框
                return;
            }
            
            const addedCount = this.manualData.length; // 保存添加数量
            
            // 当合并数据时，确保旧数据也包含进来，而不是完全替换
            this.data = this.data.concat(this.manualData);
            
            // 如果原来没有数据，需要从新添加的数据中提取科目列表
            if (this.data.length === this.manualData.length) {
                // 这说明之前没有数据，现在全是新添加的
                this.subjects = this.getSubjectsFromData(this.data);
            }
            
            this.manualData = []; // 清空手动数据缓存
            this.hideManualInputModal();
            this.displayDataPreview(); // 此方法会调用 renderDataTable 和 updateHeaderStats
            this.showSection('data-preview-section');
            this.showToast(`成功添加 ${addedCount} 条数据。`, 'success');
        }
    }

    showAnalysisOptions() {
        this.showAnalysisOptionsModal();
    }

    generateCharts() {
        console.log('generateCharts方法被调用');
        console.log('当前数据:', this.data);
        
        // 隐藏分析选项模态框
        this.hideAnalysisOptionsModal();
        
        // 显示图表区域
        document.getElementById('chartsSection').style.display = 'block';
        
        // 滚动到图表区域
        document.getElementById('chartsSection').scrollIntoView({ 
            behavior: 'smooth' 
        });

        // 生成各种图表
        setTimeout(() => {
            this.createCharts();
            this.generateSummary();
        }, 500);
    }

    createCharts() {
        console.log('Creating charts, data:', this.data);
        console.log('Chart object available:', typeof Chart !== 'undefined');
        console.log('开始创建图表...');

        if (!this.data || this.data.length === 0) {
            this.showToast('没有数据可以生成图表。', 'warning');
            return;
        }

        // 销毁已存在的图表实例，避免Canvas重用错误
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key] && typeof this.charts[key].destroy === 'function') {
                console.log(`销毁旧图表: ${key}`);
                this.charts[key].destroy();
                delete this.charts[key];
            }
        });

        // 获取选中的图表类型
        const chartOptions = {
            studentRanking: document.getElementById('studentRanking').checked,
            subjectStats: document.getElementById('subjectStats').checked,
            gradeDistribution: document.getElementById('gradeDistribution').checked,
            passRate: document.getElementById('passRate').checked,
            barChart: document.getElementById('barChart').checked,
            lineChart: document.getElementById('lineChart').checked,
            pieChart: document.getElementById('pieChart').checked,
            radarChart: document.getElementById('radarChart').checked,
            scatterChart: document.getElementById('scatterChart').checked,
            boxChart: document.getElementById('boxChart').checked,
            stackedBarChart: document.getElementById('stackedBarChart').checked,
            heatmapChart: document.getElementById('heatmapChart').checked
        };

        // 获取选中的分析维度
        const analysisOptions = {
            bySubject: document.getElementById('bySubject').checked,
            byStudent: document.getElementById('byStudent').checked,
            byGrade: document.getElementById('byGrade').checked,
            byScoreRange: document.getElementById('byScoreRange').checked,
            byRanking: document.getElementById('byRanking').checked,
            byStrengthSubject: document.getElementById('byStrengthSubject').checked,
            byProgress: document.getElementById('byProgress').checked,
            byStability: document.getElementById('byStability').checked
        };

        console.log('选中的图表类型:', chartOptions);
        console.log('选中的分析维度:', analysisOptions);

        // 检查是否至少选择了一个分析维度
        const hasAnalysisDimension = Object.values(analysisOptions).some(checked => checked);
        if (!hasAnalysisDimension) {
            this.showToast('请至少选择一个分析维度', 'warning');
            return;
        }

        const chartManager = new ChartManager(this.data, analysisOptions);
        console.log('ChartManager已创建，包含分析选项');

        // 显示/隐藏图表卡片
        document.getElementById('studentRankingCard').style.display = chartOptions.studentRanking ? 'block' : 'none';
        document.getElementById('subjectStatsCard').style.display = chartOptions.subjectStats ? 'block' : 'none';
        document.getElementById('gradeDistributionCard').style.display = chartOptions.gradeDistribution ? 'block' : 'none';
        document.getElementById('passRateCard').style.display = chartOptions.passRate ? 'block' : 'none';
        document.getElementById('barChartCard').style.display = chartOptions.barChart ? 'block' : 'none';
        document.getElementById('lineChartCard').style.display = chartOptions.lineChart ? 'block' : 'none';
        document.getElementById('pieChartCard').style.display = chartOptions.pieChart ? 'block' : 'none';
        document.getElementById('radarChartCard').style.display = chartOptions.radarChart ? 'block' : 'none';
        document.getElementById('scatterChartCard').style.display = chartOptions.scatterChart ? 'block' : 'none';
        document.getElementById('boxChartCard').style.display = chartOptions.boxChart ? 'block' : 'none';
        document.getElementById('stackedBarChartCard').style.display = chartOptions.stackedBarChart ? 'block' : 'none';
        document.getElementById('heatmapChartCard').style.display = chartOptions.heatmapChart ? 'block' : 'none';

        // 生成选中的图表
        if (chartOptions.studentRanking) {
            console.log('创建学生排名图表...');
            this.charts.studentRanking = chartManager.createStudentRankingChart('studentRankingCanvas');
        }
        if (chartOptions.subjectStats) {
            console.log('创建科目统计图表...');
            this.charts.subjectStats = chartManager.createSubjectStatsChart('subjectStatsCanvas');
        }
        if (chartOptions.gradeDistribution) {
            console.log('创建等级分布图表...');
            this.charts.gradeDistribution = chartManager.createGradeDistributionChart('gradeDistributionCanvas');
        }
        if (chartOptions.passRate) {
            console.log('创建及格率图表...');
            this.charts.passRate = chartManager.createPassRateChart('passRateCanvas');
        }
        if (chartOptions.barChart) {
            console.log('创建柱状图...');
            this.charts.bar = chartManager.createBarChart('barChartCanvas');
        }
        if (chartOptions.lineChart) {
            console.log('创建折线图...');
            this.charts.line = chartManager.createLineChart('lineChartCanvas');
        }
        if (chartOptions.pieChart) {
            console.log('创建饼图...');
            this.charts.pie = chartManager.createPieChart('pieChartCanvas');
        }
        if (chartOptions.radarChart) {
            console.log('创建雷达图...');
            this.charts.radar = chartManager.createRadarChart('radarChartCanvas');
        }
        if (chartOptions.scatterChart) {
            console.log('创建散点图...');
            this.charts.scatter = chartManager.createScatterChart('scatterChartCanvas');
        }
        if (chartOptions.boxChart) {
            console.log('创建箱线图...');
            this.charts.box = chartManager.createBoxChart('boxChartCanvas');
        }
        if (chartOptions.stackedBarChart) {
            console.log('创建堆积柱状图...');
            this.charts.stackedBar = chartManager.createStackedBarChart('stackedBarChartCanvas');
        }
        if (chartOptions.heatmapChart) {
            console.log('创建热力图...');
            this.charts.heatmap = chartManager.createHeatmapChart('heatmapChartCanvas');
        }
        
        console.log('图表创建完成');
    }

    generateSummary() {
        if (!this.data || this.data.length === 0) return '';

        const processor = new DataProcessor(this.data);
        const rankings = processor.calculateStudentRankings();
        const subjectStats = processor.calculateSubjectDetailedStats();
        const subjectRankings = processor.generateSubjectRankings();
        
        const summaryGrid = document.getElementById('summaryGrid');
        if (!summaryGrid) return '';

        // 清空现有内容
        summaryGrid.innerHTML = '';

        // 1. 班级整体分析（放在最上面）
        const totalStudents = this.data.length;
        let excellentStudents = 0;
        let goodStudents = 0;
        let passStudents = 0;
        let failStudents = 0;

        this.data.forEach(student => {
            const headers = Object.keys(student);
            let total = 0;
            let subjectCount = 0;

            headers.forEach(header => {
                if (!['姓名', 'name', '学生姓名', 'Name', 'NAME', '学生'].includes(header)) {
                    total += parseFloat(student[header]) || 0;
                    subjectCount++;
                }
            });

            const average = subjectCount > 0 ? total / subjectCount : 0;
            
            if (average >= 90) excellentStudents++;
            else if (average >= 80) goodStudents++;
            else if (average >= 60) passStudents++;
            else failStudents++;
        });

        const classAnalysisDiv = document.createElement('div');
        classAnalysisDiv.className = 'summary-item class-analysis';
        classAnalysisDiv.innerHTML = `
            <h4>🎯 班级整体分析</h4>
            <div class="class-analysis-content">
                <div class="class-grade-distribution">
                    <div class="grade-item excellent">
                        <div class="grade-label">优秀学生 (90分以上)</div>
                        <div class="grade-count">${excellentStudents}人</div>
                        <div class="grade-percentage">${((excellentStudents / totalStudents) * 100).toFixed(1)}%</div>
                    </div>
                    <div class="grade-item good">
                        <div class="grade-label">良好学生 (80-89分)</div>
                        <div class="grade-count">${goodStudents}人</div>
                        <div class="grade-percentage">${((goodStudents / totalStudents) * 100).toFixed(1)}%</div>
                    </div>
                    <div class="grade-item pass">
                        <div class="grade-label">及格学生 (60-79分)</div>
                        <div class="grade-count">${passStudents}人</div>
                        <div class="grade-percentage">${((passStudents / totalStudents) * 100).toFixed(1)}%</div>
                    </div>
                    <div class="grade-item fail">
                        <div class="grade-label">待提高学生 (60分以下)</div>
                        <div class="grade-count">${failStudents}人</div>
                        <div class="grade-percentage">${((failStudents / totalStudents) * 100).toFixed(1)}%</div>
                    </div>
                </div>
            </div>
        `;
        summaryGrid.appendChild(classAnalysisDiv);

        // 2. 创建左右布局容器：各科第一名（左侧）
        const topRowContainer = document.createElement('div');
        topRowContainer.className = 'summary-row-container';
        
        const subjectTopDiv = document.createElement('div');
        subjectTopDiv.className = 'summary-item subject-top-compact';
        
        let subjectTopList = '';
        Object.keys(subjectRankings).forEach(subject => {
            const topStudent = subjectRankings[subject][0];
            subjectTopList += `
                <div class="subject-top-item">
                    <span class="subject">${subject}</span>
                    <span class="top-student">${topStudent.name} (${topStudent.score}分)</span>
                </div>
            `;
        });

        subjectTopDiv.innerHTML = `
            <h4>🏆 各科第一名</h4>
            <div class="subject-top-list">
                ${subjectTopList}
            </div>
        `;
        
        topRowContainer.appendChild(subjectTopDiv);
        summaryGrid.appendChild(topRowContainer);

        // 3. 各科目详细统计（修复字段名问题）
        const subjectStatsDiv = document.createElement('div');
        subjectStatsDiv.className = 'summary-item subject-stats';
        
        let subjectStatsGrid = '';
        Object.keys(subjectStats).forEach(subject => {
            const stats = subjectStats[subject];
            subjectStatsGrid += `
                <div class="subject-stat-item">
                    <h5>${subject}</h5>
                    <div class="stat-details">
                        <div class="stat-row">
                            <span class="stat-label">平均分：</span>
                            <span class="stat-value avg-score">${stats.average}分</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">最高分：</span>
                            <span class="stat-value max-score">${stats.max}分</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">最低分：</span>
                            <span class="stat-value min-score">${stats.min}分</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">及格率：</span>
                            <span class="stat-value pass-rate">${stats.passRate}%</span>
                        </div>
                    </div>
                    <div class="grade-breakdown">
                        <div class="grade excellent clickable-grade" data-subject="${subject}" data-grade="excellent">优秀 ${stats.excellent.count}人 (${stats.excellent.rate}%)</div>
                        <div class="grade good clickable-grade" data-subject="${subject}" data-grade="good">良好 ${stats.good.count}人 (${stats.good.rate}%)</div>
                        <div class="grade pass clickable-grade" data-subject="${subject}" data-grade="pass">及格 ${stats.pass.count}人 (${(((stats.pass.count) / stats.totalStudents) * 100).toFixed(1)}%)</div>
                        <div class="grade fail clickable-grade" data-subject="${subject}" data-grade="fail">不及格 ${stats.fail.count}人 (${stats.fail.rate}%)</div>
                    </div>
                </div>
            `;
        });

        subjectStatsDiv.innerHTML = `
            <h4>📈 各科目详细统计</h4>
            <div class="subject-stats-grid">
                ${subjectStatsGrid}
            </div>
        `;
        summaryGrid.appendChild(subjectStatsDiv);
        
        // 添加等级点击事件监听器
        this.setupGradeClickListeners();
    }

    // 设置等级点击事件监听器（新增方法）
    setupGradeClickListeners() {
        const gradeElements = document.querySelectorAll('.clickable-grade');
        
        gradeElements.forEach(element => {
            element.addEventListener('click', (e) => {
                const subject = e.target.getAttribute('data-subject');
                const gradeType = e.target.getAttribute('data-grade');
                
                // 只有当该等级有学生时才显示弹窗
                const gradeText = e.target.textContent;
                const studentCount = parseInt(gradeText.match(/(\d+)人/)[1]);
                
                if (studentCount > 0) {
                    this.showGradeDetailModal(subject, gradeType);
                } else {
                    this.showToast(`${subject}科目暂无该等级学生`, 'info');
                }
            });
        });
    }

    // 显示等级详情模态框（新增方法）
    showGradeDetailModal(subject, gradeType) {
        const processor = new DataProcessor(this.data);
        const students = processor.getSubjectGradeStudents(subject, gradeType);
        
        if (students.length === 0) {
            this.showToast(`${subject}科目暂无该等级学生`, 'info');
            return;
        }

        // 等级名称映射
        const gradeNames = {
            excellent: '优秀 (90-100分)',
            good: '良好 (80-89分)',
            pass: '及格 (60-79分)',
            fail: '不及格 (60分以下)'
        };

        // 等级图标映射
        const gradeIcons = {
            excellent: '🏆',
            good: '👏',
            pass: '✅',
            fail: '📈'
        };

        // 设置模态框标题
        const modalTitle = document.getElementById('gradeDetailTitle');
        modalTitle.textContent = `${gradeIcons[gradeType]} ${subject} - ${gradeNames[gradeType]}`;

        // 生成概况信息
        const summary = document.getElementById('gradeDetailSummary');
        const avgScore = (students.reduce((sum, s) => sum + s.score, 0) / students.length).toFixed(1);
        const maxScore = Math.max(...students.map(s => s.score));
        const minScore = Math.min(...students.map(s => s.score));

        summary.innerHTML = `
            <h4>${gradeNames[gradeType]} 概况</h4>
            <div class="summary-stats">
                <div class="stat-item">
                    <span class="stat-label">人数</span>
                    <span class="stat-value">${students.length}人</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">平均分</span>
                    <span class="stat-value">${avgScore}分</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">最高分</span>
                    <span class="stat-value">${maxScore}分</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">最低分</span>
                    <span class="stat-value">${minScore}分</span>
                </div>
            </div>
        `;

        // 生成学生列表
        const studentList = document.getElementById('gradeDetailList');
        let studentsHtml = `
            <div class="list-header">
                <span>学生姓名</span>
                <span>成绩</span>
                <span>排名</span>
            </div>
        `;

        students.forEach(student => {
            studentsHtml += `
                <div class="student-item">
                    <span class="student-name">${student.name}</span>
                    <span class="student-score ${gradeType}">${student.score}分</span>
                    <span class="student-rank">第${student.rank}名</span>
                </div>
            `;
        });

        studentList.innerHTML = studentsHtml;

        // 显示模态框
        document.getElementById('gradeDetailModal').style.display = 'block';

        // 设置导出功能的数据
        this.currentGradeDetailData = {
            subject: subject,
            gradeType: gradeType,
            gradeName: gradeNames[gradeType],
            students: students
        };
    }

    // 初始化等级详情模态框事件监听器（需要在constructor中调用）
    initGradeDetailModal() {
        // 关闭按钮事件
        document.getElementById('closeGradeDetailModal').addEventListener('click', () => {
            document.getElementById('gradeDetailModal').style.display = 'none';
        });

        document.getElementById('closeGradeDetailBtn').addEventListener('click', () => {
            document.getElementById('gradeDetailModal').style.display = 'none';
        });

        // 点击模态框外部关闭
        document.getElementById('gradeDetailModal').addEventListener('click', (e) => {
            if (e.target.id === 'gradeDetailModal') {
                document.getElementById('gradeDetailModal').style.display = 'none';
            }
        });
    }

    // 导出等级详情列表（新增方法）
    exportGradeDetailList() {
        if (!this.currentGradeDetailData) {
            this.showToast('没有可导出的数据', 'warning');
            return;
        }

        const { subject, gradeName, students } = this.currentGradeDetailData;
        
        // 创建CSV内容
        let csvContent = '\uFEFF'; // UTF-8 BOM
        csvContent += `${subject} - ${gradeName} 学生名单\n\n`;
        csvContent += '排名,姓名,成绩\n';
        
        students.forEach(student => {
            csvContent += `${student.rank},${student.name},${student.score}\n`;
        });

        // 添加统计信息
        const avgScore = (students.reduce((sum, s) => sum + s.score, 0) / students.length).toFixed(1);
        const maxScore = Math.max(...students.map(s => s.score));
        const minScore = Math.min(...students.map(s => s.score));

        csvContent += `\n统计信息:\n`;
        csvContent += `总人数,${students.length}\n`;
        csvContent += `平均分,${avgScore}\n`;
        csvContent += `最高分,${maxScore}\n`;
        csvContent += `最低分,${minScore}\n`;

        // 创建下载
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().slice(0, 10);
        link.download = `${subject}_${gradeName}_学生名单_${timestamp}.csv`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        this.showToast('等级详情列表导出成功', 'success');
    }

    // 清空数据
    clearData() {
        if (confirm('确定要清空所有数据吗？此操作不可撤销。')) {
            this.data = [];
            
            // 销毁所有图表实例
            Object.keys(this.charts).forEach(key => {
                if (this.charts[key] && typeof this.charts[key].destroy === 'function') {
                    console.log(`清空数据时销毁图表: ${key}`);
                    this.charts[key].destroy();
                }
            });
            this.charts = {};
            
            // 重置为默认科目
            this.subjects = ['语文', '数学', '英语', '物理', '化学'];
            
            // 隐藏所有相关section
            document.getElementById('dataPreviewSection').style.display = 'none';
            document.getElementById('chartsSection').style.display = 'none';
            document.getElementById('headerStats').style.display = 'none';
            
            // 重置文件输入
            document.getElementById('fileInput').value = '';

            // 显示数据导入区域
            this.showSection('data-input-section');
            
            this.showToast('数据已清空', 'info');
        }
    }

    // 刷新图表
    refreshCharts() {
        if (this.data.length === 0) {
            this.showToast('请先加载数据', 'warning');
            return;
        }
        
        this.createCharts();
        this.generateSummary();
        this.showToast('图表已刷新', 'success');
    }

    // 保存完整分析报告为图片
    saveChartsAsImages() {
        // 获取所有可见的图表，包括新增的图表
        const chartMappings = {
            'studentRanking': 'studentRankingCard',
            'subjectStats': 'subjectStatsCard', 
            'gradeDistribution': 'gradeDistributionCard',
            'passRate': 'passRateCard',
            'bar': 'barChartCard',
            'line': 'lineChartCard',
            'pie': 'pieChartCard',
            'radar': 'radarChartCard',
            'scatter': 'scatterChartCard',
            'box': 'boxChartCard',
            'stackedBar': 'stackedBarChartCard',
            'heatmap': 'heatmapChartCard'
        };

        const visibleCharts = Object.keys(chartMappings).filter(key => {
            const card = document.getElementById(chartMappings[key]);
            return card && card.style.display !== 'none' && this.charts[key];
        });

        if (visibleCharts.length === 0) {
            this.showToast('没有可保存的图表', 'warning');
            return;
        }

        this.showToast('正在生成完整分析报告...', 'info');
        
        // 等待所有图表渲染完成后再生成报告
        setTimeout(() => {
            this.generateFullReport(visibleCharts);
        }, 1000);
    }

    // 生成完整的分析报告图片
    generateFullReport(visibleCharts) {
        // 创建一个大的canvas用于合并所有内容
        const reportCanvas = document.createElement('canvas');
        const ctx = reportCanvas.getContext('2d');
        
        // 设置报告canvas尺寸 (A4比例，高分辨率)
        const reportWidth = 1200;
        const chartWidth = 580;
        const chartHeight = 350; // 稍微减小图表高度，为统计摘要留更多空间
        const padding = 20;
        const headerHeight = 120;
        const summaryHeight = 600; // 增加统计摘要高度，确保容纳所有内容
        const chartTitleHeight = 40; // 增加图表标题高度
        
        // 计算需要的行数（每行2个图表）
        const chartsPerRow = 2;
        const chartRows = Math.ceil(visibleCharts.length / chartsPerRow);
        const chartAreaHeight = chartRows * (chartHeight + chartTitleHeight + padding) + padding;
        
        const reportHeight = headerHeight + chartAreaHeight + summaryHeight + padding * 3;
        reportCanvas.width = reportWidth;
        reportCanvas.height = reportHeight;
        
        // 设置背景色
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, reportWidth, reportHeight);
        
        // 绘制报告头部
        this.drawReportHeader(ctx, reportWidth, headerHeight);
        
        let currentY = headerHeight + padding;
        
        // 绘制图表
        const chartPromises = visibleCharts.map((chartKey, index) => {
            return new Promise((resolve) => {
                const canvasId = this.getCanvasIdByChartKey(chartKey);
                const canvas = document.getElementById(canvasId);
                if (canvas && canvas.width > 0 && canvas.height > 0) {
                    const row = Math.floor(index / chartsPerRow);
                    const col = index % chartsPerRow;
                    
                    const x = padding + col * (chartWidth + padding);
                    const y = currentY + row * (chartHeight + chartTitleHeight + padding);
                    
                    // 绘制图表标题
                    const chartNames = {
                        studentRanking: '🏆 学生总分排名榜',
                        subjectStats: '📊 各科目统计分析',
                        gradeDistribution: '📈 各科目等级分布',
                        passRate: '🎯 各科目及格率',
                        bar: '📊 成绩分布柱状图',
                        line: '📈 成绩趋势折线图',
                        pie: '🥧 等级分布饼图',
                        radar: '🔄 综合能力雷达图',
                        scatter: '🔗 科目相关性矩阵图',
                        box: '📦 分数分布箱线图',
                        stackedBar: '📚 成绩等级堆积柱状图',
                        heatmap: '🔥 成绩矩阵热力图'
                    };
                    
                    ctx.fillStyle = '#2c3e50';
                    ctx.font = 'bold 16px "Microsoft YaHei", Arial, sans-serif';
                    ctx.fillText(chartNames[chartKey] || '图表', x, y + 25);
                    
                    // 绘制图表（在标题下方留出足够空间）
                    ctx.drawImage(canvas, x, y + chartTitleHeight, chartWidth, chartHeight);
                }
                resolve();
            });
        });
        
        // 等待所有图表绘制完成，然后添加统计摘要
        Promise.all(chartPromises).then(() => {
            const summaryY = currentY + chartAreaHeight;
            this.drawEnhancedSummarySection(ctx, reportWidth, summaryY, summaryHeight);
            
            // 保存报告
            this.saveReportImage(reportCanvas);
        });
    }

    // 根据图表键获取对应的canvas ID
    getCanvasIdByChartKey(chartKey) {
        const canvasMapping = {
            studentRanking: 'studentRankingCanvas',
            subjectStats: 'subjectStatsCanvas',
            gradeDistribution: 'gradeDistributionCanvas',
            passRate: 'passRateCanvas',
            bar: 'barChartCanvas',
            line: 'lineChartCanvas', 
            pie: 'pieChartCanvas',
            radar: 'radarChartCanvas',
            scatter: 'scatterChartCanvas',
            box: 'boxChartCanvas',
            stackedBar: 'stackedBarChartCanvas',
            heatmap: 'heatmapChartCanvas'
        };
        return canvasMapping[chartKey] || `${chartKey}ChartCanvas`;
    }

    // 绘制增强的统计摘要部分
    drawEnhancedSummarySection(ctx, width, startY, height) {
        // 绘制摘要背景
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(10, startY, width - 20, height - 10);
        
        // 绘制边框
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, startY, width - 20, height - 10);
        
        // 绘制摘要标题
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 24px "Microsoft YaHei", Arial, sans-serif';
        ctx.fillText('📊 统计摘要与分析洞察', 30, startY + 35);
        
        // 绘制分隔线
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(30, startY + 45);
        ctx.lineTo(width - 30, startY + 45);
        ctx.stroke();
        
        // 动态计算各部分的位置
        let currentY = startY + 60;
        
        // 绘制班级整体概况
        const classOverviewHeight = this.drawClassOverview(ctx, width, currentY);
        currentY += classOverviewHeight + 20; // 添加间距
        
        // 绘制科目统计
        const subjectStatsHeight = this.drawSubjectStatistics(ctx, width, currentY);
        currentY += subjectStatsHeight + 20; // 添加间距
        
        // 绘制分析洞察
        this.drawAnalysisInsights(ctx, width, currentY);
    }

    // 绘制班级整体概况
    drawClassOverview(ctx, width, startY) {
        ctx.fillStyle = '#495057';
        ctx.font = 'bold 18px "Microsoft YaHei", Arial, sans-serif';
        ctx.fillText('🎯 班级整体概况', 40, startY);
        
        // 计算班级等级分布
        const totalStudents = this.data.length;
        let excellentStudents = 0;
        let goodStudents = 0;
        let passStudents = 0;
        let failStudents = 0;

        this.data.forEach(student => {
            const headers = Object.keys(student);
            let total = 0;
            let subjectCount = 0;

            headers.forEach(header => {
                if (!['姓名', 'name', '学生姓名', 'Name', 'NAME', '学生'].includes(header)) {
                    total += parseFloat(student[header]) || 0;
                    subjectCount++;
                }
            });

            const average = subjectCount > 0 ? total / subjectCount : 0;
            
            if (average >= 90) excellentStudents++;
            else if (average >= 80) goodStudents++;
            else if (average >= 60) passStudents++;
            else failStudents++;
        });

        const stats = [
            { label: '优秀学生', count: excellentStudents, color: '#28a745' },
            { label: '良好学生', count: goodStudents, color: '#007bff' },
            { label: '及格学生', count: passStudents, color: '#ffc107' },
            { label: '待提升学生', count: failStudents, color: '#dc3545' }
        ];

        // 绘制统计卡片
        const cardWidth = (width - 100) / 4;
        stats.forEach((stat, index) => {
            const x = 50 + index * cardWidth;
            const y = startY + 25;
            
            // 绘制卡片背景
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y, cardWidth - 10, 80);
            ctx.strokeStyle = stat.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, cardWidth - 10, 80);
            
            // 绘制标题
            ctx.fillStyle = stat.color;
            ctx.font = 'bold 14px "Microsoft YaHei", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(stat.label, x + (cardWidth - 10) / 2, y + 20);
            
            // 绘制数量
            ctx.font = 'bold 20px "Microsoft YaHei", Arial, sans-serif';
            ctx.fillText(`${stat.count}人`, x + (cardWidth - 10) / 2, y + 45);
            
            // 绘制百分比
            ctx.font = '12px "Microsoft YaHei", Arial, sans-serif';
            ctx.fillStyle = '#6c757d';
            ctx.fillText(`${((stat.count / totalStudents) * 100).toFixed(1)}%`, x + (cardWidth - 10) / 2, y + 65);
        });
        
        ctx.textAlign = 'left'; // 重置文本对齐
        
        // 返回班级整体概况使用的总高度
        return 105; // 标题25 + 卡片80
    }

    // 绘制科目统计
    drawSubjectStatistics(ctx, width, startY) {
        ctx.fillStyle = '#495057';
        ctx.font = 'bold 18px "Microsoft YaHei", Arial, sans-serif';
        ctx.fillText('📈 各科目表现', 40, startY);
        
        // 计算科目统计
        const subjectStats = this.subjects.map(subject => {
            const scores = this.data.map(student => student[subject]);
            const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
            const max = Math.max(...scores);
            const min = Math.min(...scores);
            const passRate = ((scores.filter(s => s >= 60).length / scores.length) * 100).toFixed(1);
            
            return { subject, avg: parseFloat(avg), max, min, passRate: parseFloat(passRate) };
        });
        
        // 绘制科目表格
        const tableY = startY + 25;
        const rowHeight = 25;
        const colWidths = [150, 100, 100, 100, 100];
        const headers = ['科目', '平均分', '最高分', '最低分', '及格率'];
        
        // 绘制表头
        let currentX = 50;
        ctx.fillStyle = '#343a40';
        ctx.fillRect(currentX, tableY, colWidths.reduce((a, b) => a + b, 0), rowHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px "Microsoft YaHei", Arial, sans-serif';
        headers.forEach((header, index) => {
            ctx.fillText(header, currentX + 10, tableY + 17);
            currentX += colWidths[index];
        });
        
        // 绘制数据行
        subjectStats.forEach((stat, rowIndex) => {
            const y = tableY + (rowIndex + 1) * rowHeight;
            currentX = 50;
            
            // 绘制行背景
            ctx.fillStyle = rowIndex % 2 === 0 ? '#f8f9fa' : '#ffffff';
            ctx.fillRect(currentX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight);
            
            // 绘制数据
            const data = [stat.subject, `${stat.avg}分`, `${stat.max}分`, `${stat.min}分`, `${stat.passRate}%`];
            ctx.fillStyle = '#495057';
            ctx.font = '13px "Microsoft YaHei", Arial, sans-serif';
            
            data.forEach((value, colIndex) => {
                ctx.fillText(value, currentX + 10, y + 17);
                currentX += colWidths[colIndex];
            });
        });
        
        // 返回科目统计表格使用的总高度
        const totalRows = subjectStats.length + 1; // 数据行 + 表头
        return 25 + (totalRows * rowHeight); // 标题25 + 表格高度
    }

    // 绘制分析洞察
    drawAnalysisInsights(ctx, width, startY) {
        ctx.fillStyle = '#495057';
        ctx.font = 'bold 18px "Microsoft YaHei", Arial, sans-serif';
        ctx.fillText('💡 分析洞察', 40, startY);
        
        // 分析数据并生成洞察
        const allScores = this.getAllScores();
        const maxScore = Math.max(...allScores);
        const minScore = Math.min(...allScores);
        const averageScore = (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1);
        
        // 找出最佳和最弱科目
        const subjectAvgs = this.subjects.map(subject => {
            const scores = this.data.map(student => student[subject]);
            return {
                subject,
                avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
            };
        });
        
        const bestSubject = subjectAvgs.reduce((a, b) => parseFloat(a.avg) > parseFloat(b.avg) ? a : b);
        const weakestSubject = subjectAvgs.reduce((a, b) => parseFloat(a.avg) < parseFloat(b.avg) ? a : b);
        
        // 找出班级前三名
        const topStudents = this.data.map(student => {
            const nameField = this.getNameField();
            const headers = Object.keys(student);
            let total = 0;
            let subjectCount = 0;

            headers.forEach(header => {
                if (!['姓名', 'name', '学生姓名', 'Name', 'NAME', '学生'].includes(header)) {
                    total += parseFloat(student[header]) || 0;
                    subjectCount++;
                }
            });

            return {
                name: student[nameField],
                total: total,
                average: subjectCount > 0 ? (total / subjectCount).toFixed(1) : 0
            };
        }).sort((a, b) => b.total - a.total).slice(0, 3);
        
        const insights = [
            `🏆 总分排名前三名：${topStudents.map(s => `${s.name}(总分${s.total}分,均分${s.average}分)`).join('、')}`,
            `📊 班级最优科目：${bestSubject.subject}，班级平均分${bestSubject.avg}分`,
            `📈 班级薄弱科目：${weakestSubject.subject}，班级平均分${weakestSubject.avg}分`,
            `📏 全班分数分布：最高${maxScore}分，最低${minScore}分，跨度${maxScore - minScore}分`,
            `🎯 班级整体水平：全科平均${averageScore}分，等级为${averageScore >= 85 ? '优秀' : averageScore >= 75 ? '良好' : averageScore >= 65 ? '及格' : '需要提升'}`,
            `📋 数据概况：共${this.data.length}名学生，${this.subjects.length}个考试科目`
        ];
        
        // 绘制洞察背景框
        const insightBoxHeight = insights.length * 22 + 20;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(40, startY + 15, width - 100, insightBoxHeight);
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 1;
        ctx.strokeRect(40, startY + 15, width - 100, insightBoxHeight);
        
        // 绘制洞察内容
        ctx.fillStyle = '#6c757d';
        ctx.font = '14px "Microsoft YaHei", Arial, sans-serif';
        insights.forEach((insight, index) => {
            // 限制文本长度，避免超出边界
            const maxWidth = width - 140;
            let displayText = insight;
            
            // 如果文本太长，进行截断
            if (ctx.measureText(insight).width > maxWidth) {
                while (ctx.measureText(displayText + '...').width > maxWidth && displayText.length > 10) {
                    displayText = displayText.slice(0, -1);
                }
                displayText += '...';
            }
            
            ctx.fillText(displayText, 50, startY + 35 + index * 22);
        });
    }

    // 获取姓名字段
    getNameField() {
        const nameFields = ['姓名', 'name', '学生姓名', 'Name', 'NAME', '学生'];
        for (const field of nameFields) {
            if (this.data.length > 0 && this.data[0].hasOwnProperty(field)) {
                return field;
            }
        }
        return '姓名'; // 默认返回
    }
    
    // 绘制报告头部
    drawReportHeader(ctx, width, height) {
        // 设置渐变背景
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // 绘制标题
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📊 成绩分析报告', width / 2, 45);
        
        // 绘制基本信息
        const studentCount = this.data.length;
        const subjectCount = this.subjects.length;
        const allScores = this.getAllScores();
        const averageScore = (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1);
        const currentDate = new Date().toLocaleDateString('zh-CN');
        
        ctx.font = '18px Arial';
        ctx.fillText(`学生人数: ${studentCount}名 | 科目数量: ${subjectCount}个 | 平均分: ${averageScore}分`, width / 2, 75);
        ctx.font = '14px Arial';
        ctx.fillText(`生成时间: ${currentDate}`, width / 2, 95);
        
        ctx.textAlign = 'left'; // 重置文本对齐
    }
    
    // 绘制统计摘要部分
    drawSummarySection(ctx, width, startY, height) {
        // 绘制摘要背景
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(10, startY, width - 20, height - 10);
        
        // 绘制边框
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, startY, width - 20, height - 10);
        
        // 绘制摘要标题
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('📈 统计摘要', 30, startY + 30);
        
        // 绘制分隔线
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(30, startY + 40);
        ctx.lineTo(width - 30, startY + 40);
        ctx.stroke();
        
        // 获取统计数据
        try {
            const dataProcessor = new DataProcessor(this.data);
            const summary = dataProcessor.generateSummary();
            
            // 绘制统计信息 - 使用更好的布局
            const items = Object.keys(summary);
            const itemsPerRow = 4;
            const itemWidth = (width - 80) / itemsPerRow;
            
            ctx.font = '13px Arial';
            items.forEach((key, index) => {
                const row = Math.floor(index / itemsPerRow);
                const col = index % itemsPerRow;
                const x = 40 + col * itemWidth;
                const y = startY + 70 + row * 45; // 增加行间距
                
                // 绘制小的背景框
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x - 5, y - 20, itemWidth - 10, 38); // 稍微增加框高
                ctx.strokeStyle = '#e9ecef';
                ctx.lineWidth = 1;
                ctx.strokeRect(x - 5, y - 20, itemWidth - 10, 38);
                
                // 绘制标签
                ctx.fillStyle = '#6c757d';
                ctx.font = '12px Arial';
                ctx.fillText(summary[key].label, x, y - 8);
                
                // 绘制数值
                ctx.fillStyle = '#007bff';
                ctx.font = 'bold 14px Arial';
                const value = summary[key].value.toString();
                const maxWidth = itemWidth - 20;
                if (ctx.measureText(value).width > maxWidth) {
                    ctx.font = 'bold 12px Arial';
                }
                ctx.fillText(value.length > 15 ? value.substring(0, 12) + '...' : value, x, y + 8);
            });
            
            // 添加额外的分析信息
            this.drawAdditionalStats(ctx, width, startY + 180);
            
        } catch (error) {
            console.error('生成统计摘要时出错:', error);
            ctx.fillStyle = '#dc3545';
            ctx.font = '16px Arial';
            ctx.fillText('统计摘要生成失败', 30, startY + 60);
        }
    }
    
    // 绘制额外的统计信息
    drawAdditionalStats(ctx, width, startY) {
        // 绘制分析建议标题
        ctx.fillStyle = '#495057';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('💡 分析洞察', 40, startY);
        
        // 分析数据并生成洞察
        const allScores = this.getAllScores();
        const maxScore = Math.max(...allScores);
        const minScore = Math.min(...allScores);
        const averageScore = (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1);
        
        // 找出最佳和最弱科目
        const subjectAvgs = this.subjects.map(subject => {
            const scores = this.data.map(student => student[subject]);
            return {
                subject,
                avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
            };
        });
        
        const bestSubject = subjectAvgs.reduce((a, b) => parseFloat(a.avg) > parseFloat(b.avg) ? a : b);
        const weakestSubject = subjectAvgs.reduce((a, b) => parseFloat(a.avg) < parseFloat(b.avg) ? a : b);
        
        const insights = [
            `班级最优科目: ${bestSubject.subject}，班级平均分${bestSubject.avg}分`,
            `班级薄弱科目: ${weakestSubject.subject}，班级平均分${weakestSubject.avg}分`,
            `全班分数分布: 最高${maxScore}分，最低${minScore}分，跨度${maxScore - minScore}分`,
            `班级整体水平: 全科平均${averageScore}分，等级为${averageScore >= 80 ? '优秀' : averageScore >= 70 ? '良好' : averageScore >= 60 ? '及格' : '需要提升'}`
        ];
        
        ctx.fillStyle = '#6c757d';
        ctx.font = '12px Arial';
        insights.forEach((insight, index) => {
            ctx.fillText(`• ${insight}`, 50, startY + 20 + index * 16);
        });
    }
    
    // 保存报告图片
    saveReportImage(canvas) {
        try {
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            link.download = `成绩分析报告_${timestamp}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showToast('完整分析报告已保存！', 'success');
        } catch (error) {
            console.error('保存报告失败:', error);
            this.showToast('保存报告失败，请重试', 'error');
        }
    }

    // 显示提示消息
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = document.querySelector('.toast-icon');
        const messageEl = document.querySelector('.toast-message');
        
        // 设置图标和样式
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        icon.textContent = icons[type] || icons.success;
        messageEl.textContent = message;
        
        // 重置类名
        toast.className = 'toast';
        if (type !== 'success') {
            toast.classList.add(type);
        }
        
        // 显示提示
        toast.style.display = 'block';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    // 设置文件拖拽功能
    setupFileDragDrop() {
        const dropZone = document.querySelector('.data-input-section');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload({ target: { files: files } });
            }
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // 更新头部统计信息
    updateHeaderStats() {
        if (this.data.length > 0) {
            const headerStats = document.getElementById('headerStats');
            const quickStats = document.getElementById('quickStats');
            
            const studentCount = this.data.length;
            const subjectCount = this.subjects.length; // 使用动态科目数量
            const allScores = this.getAllScores();
            const averageScore = (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1);
            
            quickStats.textContent = `${studentCount}名学生 | ${subjectCount}个科目 | 平均分${averageScore}`;
            headerStats.style.display = 'flex';
        }
    }

    // 新增：渲染科目标签列表
    renderSubjectsList() {
        const subjectsList = document.getElementById('subjectsList');
        subjectsList.innerHTML = '';

        this.subjects.forEach((subject, index) => {
            const tag = document.createElement('div');
            tag.className = 'subject-tag';
            tag.innerHTML = `
                <span>${subject}</span>
                <button class="remove-btn" data-subject-index="${index}" title="删除科目">×</button>
            `;
            
            // 添加删除事件监听
            const removeBtn = tag.querySelector('.remove-btn');
            removeBtn.addEventListener('click', () => {
                this.removeSubject(index);
            });
            
            subjectsList.appendChild(tag);
        });
    }

    // 新增：添加新科目
    addNewSubject() {
        const input = document.getElementById('newSubjectInput');
        const newSubject = input.value.trim();
        
        if (!newSubject) {
            this.showToast('请输入科目名称', 'warning');
            return;
        }
        
        if (newSubject.length > 10) {
            this.showToast('科目名称不能超过10个字符', 'warning');
            return;
        }
        
        if (this.subjects.includes(newSubject)) {
            this.showToast('该科目已存在', 'warning');
            return;
        }
        
        // 添加科目
        this.subjects.push(newSubject);
        input.value = '';
        
        // 更新界面
        this.renderSubjectsList();
        this.generateDynamicForm();
        
        this.showToast(`科目"${newSubject}"添加成功`, 'success');
    }

    // 新增：删除科目
    removeSubject(index) {
        if (this.subjects.length <= 1) {
            this.showToast('至少需要保留一个科目', 'warning');
            return;
        }
        
        const removedSubject = this.subjects[index];
        this.subjects.splice(index, 1);
        
        // 更新界面
        this.renderSubjectsList();
        this.generateDynamicForm();
        
        this.showToast(`科目"${removedSubject}"已删除`, 'info');
    }

    // 新增：显示分析选项模态框
    showAnalysisOptionsModal() {
        document.getElementById('analysisOptionsModal').style.display = 'flex';
    }

    // 新增：隐藏分析选项模态框
    hideAnalysisOptionsModal() {
        document.getElementById('analysisOptionsModal').style.display = 'none';
    }

    // 暗黑模式相关方法
    initDarkMode() {
        console.log('初始化暗黑模式...');
        
        // 从localStorage获取用户偏好，如果没有则检测系统偏好
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        console.log('保存的主题:', savedTheme);
        console.log('系统偏好暗黑模式:', prefersDark);
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            this.enableDarkMode();
        } else {
            this.disableDarkMode();
        }
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            console.log('系统主题变化:', e.matches);
            if (!localStorage.getItem('theme')) {
                if (e.matches) {
                    this.enableDarkMode();
                } else {
                    this.disableDarkMode();
                }
            }
        });
    }

    toggleDarkMode() {
        console.log('切换暗黑模式，当前状态:', document.body.classList.contains('dark-mode'));
        
        if (document.body.classList.contains('dark-mode')) {
            this.disableDarkMode();
            localStorage.setItem('theme', 'light');
            console.log('切换到浅色模式');
        } else {
            this.enableDarkMode();
            localStorage.setItem('theme', 'dark');
            console.log('切换到暗黑模式');
        }
    }

    enableDarkMode() {
        console.log('启用暗黑模式');
        
        // 移除浅色模式标识，添加暗黑模式标识
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = '☀️';
        }
        
        // 添加一个平滑的过渡效果
        document.body.style.transition = 'background 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
        
        console.log('暗黑模式已启用，body classes:', document.body.className);
    }

    disableDarkMode() {
        console.log('禁用暗黑模式');
        
        // 移除暗黑模式标识，添加浅色模式标识
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = '🌙';
        }
        
        // 添加一个平滑的过渡效果
        document.body.style.transition = 'background 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
        
        console.log('暗黑模式已禁用，body classes:', document.body.className);
    }

    // 更新：增强示例CSV下载，添加Windows兼容性
    downloadSampleCSV() {
        // 使用当前科目列表生成示例CSV
        const headers = ['姓名', ...this.subjects];
        const headerRow = headers.join(',');
        
        // 生成示例数据行
        const sampleRows = [
            `张三,${this.subjects.map(() => Math.floor(Math.random() * 40 + 60)).join(',')}`,
            `李四,${this.subjects.map(() => Math.floor(Math.random() * 40 + 60)).join(',')}`,
            `王五,${this.subjects.map(() => Math.floor(Math.random() * 40 + 60)).join(',')}`,
            `赵六,${this.subjects.map(() => Math.floor(Math.random() * 40 + 60)).join(',')}`,
            `钱七,${this.subjects.map(() => Math.floor(Math.random() * 40 + 60)).join(',')}`,
            `孙八,${this.subjects.map(() => Math.floor(Math.random() * 40 + 60)).join(',')}`
        ];
        
        // 创建CSV内容（只包含纯数据，不包含说明文字）
        const csvContent = headerRow + '\n' + sampleRows.join('\n');
        
        // 添加UTF-8 BOM以确保Windows系统正确识别编码
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;

        // 创建下载链接
        const blob = new Blob([csvWithBOM], { 
            type: 'text/csv;charset=utf-8;' 
        });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        // 生成文件名，包含时间戳以避免重复
        const timestamp = new Date().toISOString().slice(0, 10);
        link.download = `成绩数据示例_${this.subjects.length}科目_${timestamp}.csv`;
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 释放URL对象
        URL.revokeObjectURL(link.href);
        
        // 显示提示信息
        this.showToast(
            `示例CSV下载成功！包含${this.subjects.length}个科目，已优化Windows兼容性，可直接用Excel打开`, 
            'success'
        );
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new GradeAnalyzer();
});