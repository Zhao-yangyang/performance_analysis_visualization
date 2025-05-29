// 成绩分析可视化应用主文件
class GradeAnalyzer {
    constructor() {
        this.data = [];
        this.charts = {};
        this.manualData = []; // 用于手动输入时暂存数据
        this.editingStudentIndex = null; // 新增：跟踪正在编辑的学生索引
        this.subjects = ['语文', '数学', '英语', '物理', '化学']; // 默认科目列表
        this.init();
    }

    init() {
        this.bindEvents();
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

        document.getElementById('saveImageBtn').addEventListener('click', () => {
            this.saveChartsAsImages();
        });

        // 导出和打印按钮
        document.getElementById('printBtn').addEventListener('click', () => {
            this.printCharts();
        });

        // 数据管理按钮
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.clearData();
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideManualInputModal();
            }
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

        // 生成表头
        const headers = Object.keys(this.data[0]);
        const headerRow = document.createElement('tr');
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
        this.data.forEach((student, index) => {
            const row = document.createElement('tr');
            let total = 0;
            let subjectCount = 0;

            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = student[header];
                if (!['姓名', 'name', '学生姓名', 'Name', 'NAME', '学生'].includes(header)) {
                    total += parseFloat(student[header]) || 0;
                    subjectCount++;
                }
                row.appendChild(td);
            });

            // 添加总分
            const totalTd = document.createElement('td');
            totalTd.textContent = total;
            totalTd.style.fontWeight = 'bold';
            totalTd.style.color = '#667eea';
            row.appendChild(totalTd);

            // 添加平均分
            const avgTd = document.createElement('td');
            avgTd.textContent = subjectCount > 0 ? (total / subjectCount).toFixed(1) : 'N/A';
            avgTd.style.fontWeight = 'bold';
            avgTd.style.color = '#764ba2';
            row.appendChild(avgTd);

            // 添加操作按钮（编辑）
            const actionTd = document.createElement('td');
            const editBtn = document.createElement('button');
            editBtn.textContent = '编辑';
            editBtn.className = 'btn btn-secondary btn-small'; // 可能需要为btn-small添加样式
            editBtn.addEventListener('click', () => this.startEditStudent(index));
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
                    <input type="number" id="subject_${i}" data-subject="${subject1}" placeholder="0-100" min="0" max="100">
                `;
                rowDiv.appendChild(group1);

                // 第二个科目（如果存在）
                if (i + 1 < this.subjects.length) {
                    const subject2 = this.subjects[i + 1];
                    const group2 = document.createElement('div');
                    group2.className = 'form-group';
                    group2.innerHTML = `
                        <label>${subject2}:</label>
                        <input type="number" id="subject_${i + 1}" data-subject="${subject2}" placeholder="0-100" min="0" max="100">
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
        document.getElementById('analysisOptionsSection').style.display = 'block';
    }

    generateCharts() {
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

        if (!this.data || this.data.length === 0) {
            this.showToast('没有数据可以生成图表。', 'warning');
            return;
        }

        const chartManager = new ChartManager(this.data);
        
        // 获取选中的图表类型
        const barChart = document.getElementById('barChart').checked;
        const lineChart = document.getElementById('lineChart').checked;
        const pieChart = document.getElementById('pieChart').checked;
        const radarChart = document.getElementById('radarChart').checked;

        // 显示/隐藏图表卡片
        document.getElementById('barChartCard').style.display = barChart ? 'block' : 'none';
        document.getElementById('lineChartCard').style.display = lineChart ? 'block' : 'none';
        document.getElementById('pieChartCard').style.display = pieChart ? 'block' : 'none';
        document.getElementById('radarChartCard').style.display = radarChart ? 'block' : 'none';

        // 生成选中的图表
        if (barChart) {
            this.charts.bar = chartManager.createBarChart('barChartCanvas');
        }
        if (lineChart) {
            this.charts.line = chartManager.createLineChart('lineChartCanvas');
        }
        if (pieChart) {
            this.charts.pie = chartManager.createPieChart('pieChartCanvas');
        }
        if (radarChart) {
            this.charts.radar = chartManager.createRadarChart('radarChartCanvas');
        }
    }

    generateSummary() {
        const dataProcessor = new DataProcessor(this.data);
        const summary = dataProcessor.generateSummary();
        
        const summaryGrid = document.getElementById('summaryGrid');
        summaryGrid.innerHTML = '';

        Object.keys(summary).forEach(key => {
            const item = document.createElement('div');
            item.className = 'summary-item';
            item.innerHTML = `
                <h4>${summary[key].label}</h4>
                <div class="value">${summary[key].value}</div>
            `;
            summaryGrid.appendChild(item);
        });
    }

    printCharts() {
        window.print();
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

    // 清空数据
    clearData() {
        if (confirm('确定要清空所有数据吗？此操作不可撤销。')) {
            this.data = [];
            this.charts = {};
            // 重置为默认科目
            this.subjects = ['语文', '数学', '英语', '物理', '化学'];
            
            // 隐藏所有相关section
            document.getElementById('dataPreviewSection').style.display = 'none';
            document.getElementById('analysisOptionsSection').style.display = 'none';
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

    // 保存所有图表为图片
    saveChartsAsImages() {
        const visibleCharts = Object.keys(this.charts).filter(key => {
            const card = document.getElementById(`${key}ChartCard`);
            return card && card.style.display !== 'none';
        });

        if (visibleCharts.length === 0) {
            this.showToast('没有可保存的图表', 'warning');
            return;
        }

        visibleCharts.forEach((chartKey, index) => {
            setTimeout(() => {
                const canvas = document.getElementById(`${chartKey}ChartCanvas`);
                if (canvas) {
                    const link = document.createElement('a');
                    const chartNames = {
                        bar: '成绩分布柱状图',
                        line: '成绩趋势折线图',
                        pie: '等级分布饼图',
                        radar: '综合能力雷达图'
                    };
                    link.download = `${chartNames[chartKey] || '图表'}_${new Date().toISOString().split('T')[0]}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                }
            }, index * 500);
        });

        this.showToast(`正在保存 ${visibleCharts.length} 个图表...`, 'info');
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
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new GradeAnalyzer();
});