// 图表管理器类
class ChartManager {
    constructor(data, analysisOptions = {}) {
        this.data = data;
        this.analysisOptions = analysisOptions;
        this.subjects = this.getSubjects();
        this.colors = {
            primary: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'],
            secondary: ['#a8edea', '#fed6e3', '#ffecd2', '#fcb69f', '#ffeaa7', '#fab1a0'],
            gradients: [
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
            ]
        };
    }

    getSubjects() {
        if (this.data.length === 0) return [];
        const firstStudent = this.data[0];
        return Object.keys(firstStudent).filter(key => 
            !['姓名', 'name', '学生姓名', 'Name', 'NAME', '学生'].includes(key)
        );
    }

    // 根据分析维度过滤数据
    filterDataByAnalysis(data = this.data) {
        let filteredData = [...data];
        
        // 如果选择了按分数段分析，只显示特定分数段的数据
        if (this.analysisOptions.byScoreRange) {
            filteredData = filteredData.filter(student => {
                const total = this.subjects.reduce((sum, subject) => sum + student[subject], 0);
                const average = total / this.subjects.length;
                return average >= 80; // 只显示平均分80分以上的学生
            });
        }
        
        // 如果选择了按排名分析，只显示前10名学生
        if (this.analysisOptions.byRanking) {
            filteredData = filteredData
                .map(student => {
                    const total = this.subjects.reduce((sum, subject) => sum + student[subject], 0);
                    return { ...student, total };
                })
                .sort((a, b) => b.total - a.total)
                .slice(0, 10);
        }
        
        return filteredData;
    }

    // 获取图表标题后缀（根据分析维度）
    getChartTitleSuffix() {
        const suffixes = [];
        if (this.analysisOptions.byScoreRange) suffixes.push('(优秀生专项)');
        if (this.analysisOptions.byRanking) suffixes.push('(前10名)');
        if (this.analysisOptions.byGrade) suffixes.push('(按等级划分)');
        if (this.analysisOptions.byStrengthSubject) suffixes.push('(优势科目)');
        if (this.analysisOptions.byProgress) suffixes.push('(进步分析)');
        if (this.analysisOptions.byStability) suffixes.push('(稳定性分析)');
        return suffixes.length > 0 ? ' ' + suffixes.join(' ') : '';
    }

    // 创建柱状图 - 各科目平均分
    createBarChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // 根据分析维度过滤数据
        const filteredData = this.filterDataByAnalysis();
        let chartData, chartTitle;
        
        if (this.analysisOptions.bySubject && filteredData.length > 0) {
            // 按科目分析 - 显示各科目的平均分
            const averages = this.subjects.map(subject => {
                const total = filteredData.reduce((sum, student) => sum + student[subject], 0);
                return (total / filteredData.length).toFixed(1);
            });
            
            chartData = {
                labels: this.subjects,
                datasets: [{
                    label: '平均分',
                    data: averages,
                    backgroundColor: this.colors.primary.slice(0, this.subjects.length),
                    borderColor: this.colors.primary.slice(0, this.subjects.length).map(color => color + 'CC'),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            };
            chartTitle = '各科目平均分对比' + this.getChartTitleSuffix();
            
        } else if (this.analysisOptions.byStudent && filteredData.length > 0) {
            // 按学生分析 - 显示学生总分排名
            const studentData = filteredData
                .map(student => {
                    const name = student['姓名'] || student['name'] || student['学生姓名'] || '未知';
                    const total = this.subjects.reduce((sum, subject) => sum + student[subject], 0);
                    return { name, total };
                })
                .sort((a, b) => b.total - a.total)
                .slice(0, 10); // 只显示前10名
            
            chartData = {
                labels: studentData.map(s => s.name),
                datasets: [{
                    label: '总分',
                    data: studentData.map(s => s.total),
                    backgroundColor: this.colors.primary.slice(0, studentData.length),
                    borderColor: this.colors.primary.slice(0, studentData.length).map(color => color + 'CC'),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            };
            chartTitle = '学生总分排名' + this.getChartTitleSuffix();
            
        } else if (this.analysisOptions.byGrade) {
            // 按等级分析 - 显示各等级人数分布
            const grades = { 'A (90-100)': 0, 'B (80-89)': 0, 'C (70-79)': 0, 'D (60-69)': 0, 'F (<60)': 0 };
            
            filteredData.forEach(student => {
                this.subjects.forEach(subject => {
                    const score = student[subject];
                    if (score >= 90) grades['A (90-100)']++;
                    else if (score >= 80) grades['B (80-89)']++;
                    else if (score >= 70) grades['C (70-79)']++;
                    else if (score >= 60) grades['D (60-69)']++;
                    else grades['F (<60)']++;
                });
            });
            
            chartData = {
                labels: Object.keys(grades),
                datasets: [{
                    label: '人次',
                    data: Object.values(grades),
                    backgroundColor: this.colors.primary.slice(0, 5),
                    borderColor: this.colors.primary.slice(0, 5).map(color => color + 'CC'),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            };
            chartTitle = '成绩等级分布' + this.getChartTitleSuffix();
            
        } else {
            // 默认显示科目平均分
            const averages = this.subjects.map(subject => {
                const total = this.data.reduce((sum, student) => sum + student[subject], 0);
                return (total / this.data.length).toFixed(1);
            });
            
            chartData = {
                labels: this.subjects,
                datasets: [{
                    label: '平均分',
                    data: averages,
                    backgroundColor: this.colors.primary.slice(0, this.subjects.length),
                    borderColor: this.colors.primary.slice(0, this.subjects.length).map(color => color + 'CC'),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            };
            chartTitle = '各科目平均分对比';
        }

        return new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: chartTitle,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: this.analysisOptions.byStudent ? undefined : 100,
                        ticks: {
                            stepSize: this.analysisOptions.byStudent ? undefined : 10
                        },
                        title: {
                            display: true,
                            text: this.analysisOptions.byStudent ? '总分' : (this.analysisOptions.byGrade ? '人次' : '分数')
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: this.analysisOptions.byStudent ? '学生' : (this.analysisOptions.byGrade ? '等级' : '科目')
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutBounce'
                }
            }
        });
    }

    // 创建折线图 - 学生成绩趋势
    createLineChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // 根据分析维度过滤数据
        const filteredData = this.filterDataByAnalysis();
        let chartData, chartTitle;
        
        if (this.analysisOptions.bySubject) {
            // 按科目分析 - 显示各科目的分数分布趋势
            const scoreRanges = ['0-59', '60-69', '70-79', '80-89', '90-100'];
            const datasets = this.subjects.map((subject, index) => {
                const distribution = [0, 0, 0, 0, 0]; // 对应上面的分数段
                
                filteredData.forEach(student => {
                    const score = student[subject];
                    if (score < 60) distribution[0]++;
                    else if (score < 70) distribution[1]++;
                    else if (score < 80) distribution[2]++;
                    else if (score < 90) distribution[3]++;
                    else distribution[4]++;
                });
                
                return {
                    label: subject,
                    data: distribution,
                    borderColor: this.colors.primary[index % this.colors.primary.length],
                    backgroundColor: this.colors.primary[index % this.colors.primary.length] + '20',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: this.colors.primary[index % this.colors.primary.length],
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                };
            });
            
            chartData = {
                labels: scoreRanges,
                datasets: datasets
            };
            chartTitle = '各科目分数分布趋势' + this.getChartTitleSuffix();
            
        } else if (this.analysisOptions.byStudent) {
            // 按学生分析 - 显示学生成绩趋势对比
            const topStudents = filteredData
                .map(student => {
                    const name = student['姓名'] || student['name'] || student['学生姓名'] || '未知';
                    const total = this.subjects.reduce((sum, subject) => sum + student[subject], 0);
                    return { ...student, name, total };
                })
                .sort((a, b) => b.total - a.total)
                .slice(0, 6); // 只显示前6名学生
            
            const datasets = topStudents.map((student, index) => {
                const scores = this.subjects.map(subject => student[subject]);
                
                return {
                    label: student.name,
                    data: scores,
                    borderColor: this.colors.primary[index % this.colors.primary.length],
                    backgroundColor: this.colors.primary[index % this.colors.primary.length] + '20',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: this.colors.primary[index % this.colors.primary.length],
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                };
            });
            
            chartData = {
                labels: this.subjects,
                datasets: datasets
            };
            chartTitle = '优秀学生成绩趋势对比' + this.getChartTitleSuffix();
            
        } else if (this.analysisOptions.byStability) {
            // 按稳定性分析 - 显示成绩波动情况
            const stabilityData = this.data.map(student => {
                const name = student['姓名'] || student['name'] || student['学生姓名'] || '未知';
                const scores = this.subjects.map(subject => student[subject]);
                const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
                const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
                const stdDev = Math.sqrt(variance);
                return { name, avg, stdDev, scores };
            }).sort((a, b) => a.stdDev - b.stdDev).slice(0, 6); // 选择最稳定的6个学生
            
            const datasets = stabilityData.map((student, index) => {
                return {
                    label: `${student.name} (标准差: ${student.stdDev.toFixed(1)})`,
                    data: student.scores,
                    borderColor: this.colors.primary[index % this.colors.primary.length],
                    backgroundColor: this.colors.primary[index % this.colors.primary.length] + '20',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: this.colors.primary[index % this.colors.primary.length],
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                };
            });
            
            chartData = {
                labels: this.subjects,
                datasets: datasets
            };
            chartTitle = '成绩稳定性分析（最稳定学生）' + this.getChartTitleSuffix();
            
        } else {
            // 默认显示前6名学生的成绩趋势
            const datasets = this.data.slice(0, 6).map((student, index) => {
                const studentName = student['姓名'] || student['name'] || student['学生姓名'];
                const scores = this.subjects.map(subject => student[subject]);
                
                return {
                    label: studentName,
                    data: scores,
                    borderColor: this.colors.primary[index % this.colors.primary.length],
                    backgroundColor: this.colors.primary[index % this.colors.primary.length] + '20',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: this.colors.primary[index % this.colors.primary.length],
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                };
            });
            
            chartData = {
                labels: this.subjects,
                datasets: datasets
            };
            chartTitle = '学生成绩趋势对比（前6名学生）';
        }

        return new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: chartTitle,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            color: '#333'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: this.analysisOptions.bySubject ? undefined : 100,
                        ticks: {
                            stepSize: this.analysisOptions.bySubject ? undefined : 10
                        },
                        title: {
                            display: true,
                            text: this.analysisOptions.bySubject ? '人数' : '分数'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: this.analysisOptions.bySubject ? '分数段' : '科目'
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    // 创建饼图 - 成绩等级分布
    createPieChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // 根据分析维度过滤数据
        const filteredData = this.filterDataByAnalysis();
        let chartData, chartTitle;
        
        if (this.analysisOptions.bySubject) {
            // 按科目分析 - 显示各科目的优秀率分布
            const subjectExcellentRates = this.subjects.map(subject => {
                const excellentCount = filteredData.filter(student => student[subject] >= 85).length;
                return {
                    subject: subject,
                    rate: ((excellentCount / filteredData.length) * 100).toFixed(1)
                };
            });
            
            chartData = {
                labels: subjectExcellentRates.map(item => `${item.subject} (${item.rate}%)`),
                datasets: [{
                    data: subjectExcellentRates.map(item => parseFloat(item.rate)),
                    backgroundColor: this.colors.primary.slice(0, this.subjects.length),
                    borderColor: '#fff',
                    borderWidth: 3,
                    hoverBorderWidth: 4,
                }]
            };
            chartTitle = '各科目优秀率分布' + this.getChartTitleSuffix();
            
        } else if (this.analysisOptions.byStudent) {
            // 按学生分析 - 显示学生等级分布
            const studentGrades = { '优秀(平均90+)': 0, '良好(平均80-89)': 0, '中等(平均70-79)': 0, '及格(平均60-69)': 0, '不及格(<60)': 0 };
            
            filteredData.forEach(student => {
                const total = this.subjects.reduce((sum, subject) => sum + student[subject], 0);
                const average = total / this.subjects.length;
                if (average >= 90) studentGrades['优秀(平均90+)']++;
                else if (average >= 80) studentGrades['良好(平均80-89)']++;
                else if (average >= 70) studentGrades['中等(平均70-79)']++;
                else if (average >= 60) studentGrades['及格(平均60-69)']++;
                else studentGrades['不及格(<60)']++;
            });
            
            chartData = {
                labels: Object.keys(studentGrades),
                datasets: [{
                    data: Object.values(studentGrades),
                    backgroundColor: this.colors.primary,
                    borderColor: '#fff',
                    borderWidth: 3,
                    hoverBorderWidth: 4,
                }]
            };
            chartTitle = '学生成绩等级分布' + this.getChartTitleSuffix();
            
        } else if (this.analysisOptions.byStrengthSubject) {
            // 按优势科目分析 - 显示学生优势科目分布
            const strengthSubjects = {};
            this.subjects.forEach(subject => {
                strengthSubjects[subject] = 0;
            });
            
            filteredData.forEach(student => {
                let maxScore = -1;
                let strengthSubject = '';
                this.subjects.forEach(subject => {
                    if (student[subject] > maxScore) {
                        maxScore = student[subject];
                        strengthSubject = subject;
                    }
                });
                if (strengthSubject) {
                    strengthSubjects[strengthSubject]++;
                }
            });
            
            chartData = {
                labels: Object.keys(strengthSubjects).map(subject => `${subject} (${strengthSubjects[subject]}人)`),
                datasets: [{
                    data: Object.values(strengthSubjects),
                    backgroundColor: this.colors.primary.slice(0, this.subjects.length),
                    borderColor: '#fff',
                    borderWidth: 3,
                    hoverBorderWidth: 4,
                }]
            };
            chartTitle = '学生优势科目分布' + this.getChartTitleSuffix();
            
        } else {
            // 默认显示成绩等级分布
            const grades = { 'A (90-100)': 0, 'B (80-89)': 0, 'C (70-79)': 0, 'D (60-69)': 0, 'F (<60)': 0 };
            
            this.data.forEach(student => {
                this.subjects.forEach(subject => {
                    const score = student[subject];
                    if (score >= 90) grades['A (90-100)']++;
                    else if (score >= 80) grades['B (80-89)']++;
                    else if (score >= 70) grades['C (70-79)']++;
                    else if (score >= 60) grades['D (60-69)']++;
                    else grades['F (<60)']++;
                });
            });
            
            chartData = {
                labels: Object.keys(grades),
                datasets: [{
                    data: Object.values(grades),
                    backgroundColor: this.colors.primary,
                    borderColor: '#fff',
                    borderWidth: 3,
                    hoverBorderWidth: 4,
                }]
            };
            chartTitle = '成绩等级分布';
        }

        return new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: chartTitle,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            color: '#333'
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 2000,
                    easing: 'easeInOutBounce'
                }
            }
        });
    }

    // 创建雷达图 - 综合能力分析
    createRadarChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // 计算各科目平均分
        const averages = this.subjects.map(subject => {
            const total = this.data.reduce((sum, student) => sum + student[subject], 0);
            return (total / this.data.length).toFixed(1);
        });

        // 找出前3名学生（按总分）
        const studentsWithTotals = this.data.map(student => {
            const studentName = student['姓名'] || student['name'] || student['学生姓名'];
            const total = this.subjects.reduce((sum, subject) => sum + student[subject], 0);
            return { ...student, name: studentName, total };
        }).sort((a, b) => b.total - a.total).slice(0, 3);

        const studentDataSets = studentsWithTotals.map((student, index) => {
            const studentName = student.name;
            return {
                label: studentName,
                data: this.subjects.map(subject => student[subject]),
                borderColor: this.colors.primary[index + 1 % this.colors.primary.length],
                backgroundColor: this.colors.primary[index + 1 % this.colors.primary.length] + '33',
                pointBackgroundColor: this.colors.primary[index + 1 % this.colors.primary.length],
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: this.colors.primary[index + 1 % this.colors.primary.length]
            };
        });

        return new Chart(ctx, {
            type: 'radar',
            data: {
                labels: this.subjects,
                datasets: [
                    {
                        label: '班级平均',
                        data: averages,
                        borderColor: this.colors.primary[0],
                        backgroundColor: this.colors.primary[0] + '33',
                        pointBackgroundColor: this.colors.primary[0],
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: this.colors.primary[0]
                    },
                    ...studentDataSets
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '综合能力雷达图 (前3名 vs 班级平均)',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            color: '#333'
                        }
                    }
                },
                scales: {
                    r: {
                        angleLines: { display: true },
                        suggestedMin: 0,
                        suggestedMax: 100,
                        pointLabels: {
                            font: {
                                size: 13
                            }
                        },
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 3
                    }
                }
            }
        });
    }

    // 创建散点图 - 学科相关性分析
    createScatterChart(canvasId, subjectX, subjectY) {
        console.log('createScatterChart被调用，canvasId:', canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas元素不存在:', canvasId);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        console.log('获取到canvas context:', ctx);
        
        // 如果科目少于2个，显示提示信息
        if (this.subjects.length < 2) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('至少需要2个科目才能进行相关性分析', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return null;
        }
        
        // 计算所有科目两两之间的相关性系数
        const correlationData = [];
        const labels = [];
        
        for (let i = 0; i < this.subjects.length; i++) {
            for (let j = i + 1; j < this.subjects.length; j++) {
                const subjectA = this.subjects[i];
                const subjectB = this.subjects[j];
                
                const scoresA = this.data.map(student => student[subjectA]);
                const scoresB = this.data.map(student => student[subjectB]);
                
                const correlation = this.calculateCorrelation(scoresA, scoresB);
                
                correlationData.push({
                    x: i,
                    y: j,
                    correlation: correlation,
                    label: `${subjectA} vs ${subjectB}`
                });
                
                labels.push(`${subjectA}-${subjectB}`);
            }
        }
        
        console.log('相关性数据:', correlationData);

        // 创建相关性柱状图
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '相关性系数',
                    data: correlationData.map(d => d.correlation),
                    backgroundColor: correlationData.map(d => {
                        const abs = Math.abs(d.correlation);
                        if (abs >= 0.7) return '#e74c3c'; // 强相关 - 红色
                        if (abs >= 0.5) return '#f39c12'; // 中等相关 - 橙色
                        if (abs >= 0.3) return '#f1c40f'; // 弱相关 - 黄色
                        return '#95a5a6'; // 很弱相关 - 灰色
                    }),
                    borderColor: '#2c3e50',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '科目相关性分析矩阵',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const correlation = context.parsed.y;
                                let strength = '';
                                const abs = Math.abs(correlation);
                                if (abs >= 0.7) strength = '强相关';
                                else if (abs >= 0.5) strength = '中等相关';
                                else if (abs >= 0.3) strength = '弱相关';
                                else strength = '很弱相关';
                                
                                return `相关性: ${correlation.toFixed(3)} (${strength})`;
                            },
                            afterLabel: function(context) {
                                return context.parsed.y > 0 ? '正相关：成绩同向变化' : '负相关：成绩反向变化';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '科目组合'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '相关性系数'
                        },
                        min: -1,
                        max: 1,
                        ticks: {
                            stepSize: 0.2,
                            callback: function(value) {
                                return value.toFixed(1);
                            }
                        }
                    }
                }
            }
        });
    }

    // 计算相关性系数的辅助方法
    calculateCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : parseFloat((numerator / denominator).toFixed(3));
    }

    // 创建混合图表 - 成绩分布与平均线
    createMixedChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const averages = this.subjects.map(subject => {
            const total = this.data.reduce((sum, student) => sum + student[subject], 0);
            return (total / this.data.length).toFixed(1);
        });

        const maxScores = this.subjects.map(subject => {
            return Math.max(...this.data.map(student => student[subject]));
        });

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.subjects,
                datasets: [
                    {
                        type: 'bar',
                        label: '平均分',
                        data: averages,
                        backgroundColor: this.colors.primary[0] + '60',
                        borderColor: this.colors.primary[0],
                        borderWidth: 2,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: '最高分',
                        data: maxScores,
                        borderColor: this.colors.primary[1],
                        backgroundColor: this.colors.primary[1] + '20',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '平均分与最高分对比',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '科目'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '分数'
                        }
                    }
                }
            }
        });
    }

    // 新增：创建箱线图 - 分数分布分析
    createBoxChart(canvasId) {
        console.log('createBoxChart被调用，canvasId:', canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas元素不存在:', canvasId);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        console.log('获取到canvas context:', ctx);
        
        // 由于Chart.js原生不支持箱线图，我们用分组柱状图模拟
        const statistics = this.subjects.map(subject => {
            const scores = this.data.map(student => student[subject]).sort((a, b) => a - b);
            const min = Math.min(...scores);
            const max = Math.max(...scores);
            const q1 = scores[Math.floor(scores.length * 0.25)];
            const median = scores[Math.floor(scores.length * 0.5)];
            const q3 = scores[Math.floor(scores.length * 0.75)];
            const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            
            return { min, q1, median, q3, max, mean };
        });

        console.log('箱线图统计数据:', statistics);

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.subjects,
                datasets: [
                    {
                        label: '最小值',
                        data: statistics.map(s => s.min),
                        backgroundColor: this.colors.primary[0] + '40',
                        borderColor: this.colors.primary[0],
                        borderWidth: 1
                    },
                    {
                        label: '第一四分位数',
                        data: statistics.map(s => s.q1),
                        backgroundColor: this.colors.primary[1] + '40',
                        borderColor: this.colors.primary[1],
                        borderWidth: 1
                    },
                    {
                        label: '中位数',
                        data: statistics.map(s => s.median),
                        backgroundColor: this.colors.primary[2] + '60',
                        borderColor: this.colors.primary[2],
                        borderWidth: 2
                    },
                    {
                        label: '第三四分位数',
                        data: statistics.map(s => s.q3),
                        backgroundColor: this.colors.primary[3] + '40',
                        borderColor: this.colors.primary[3],
                        borderWidth: 1
                    },
                    {
                        label: '最大值',
                        data: statistics.map(s => s.max),
                        backgroundColor: this.colors.primary[4] + '40',
                        borderColor: this.colors.primary[4],
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '各科目分数分布统计',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '科目'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '分数'
                        }
                    }
                }
            }
        });
    }

    // 新增：创建堆积柱状图 - 成绩段分布
    createStackedBarChart(canvasId) {
        console.log('createStackedBarChart被调用，canvasId:', canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas元素不存在:', canvasId);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        console.log('获取到canvas context:', ctx);
        
        const gradeRanges = {
            'A级 (90-100)': this.subjects.map(() => 0),
            'B级 (80-89)': this.subjects.map(() => 0),
            'C级 (70-79)': this.subjects.map(() => 0),
            'D级 (60-69)': this.subjects.map(() => 0),
            'F级 (<60)': this.subjects.map(() => 0)
        };

        this.data.forEach(student => {
            this.subjects.forEach((subject, index) => {
                const score = student[subject];
                if (score >= 90) gradeRanges['A级 (90-100)'][index]++;
                else if (score >= 80) gradeRanges['B级 (80-89)'][index]++;
                else if (score >= 70) gradeRanges['C级 (70-79)'][index]++;
                else if (score >= 60) gradeRanges['D级 (60-69)'][index]++;
                else gradeRanges['F级 (<60)'][index]++;
            });
        });

        const datasets = Object.keys(gradeRanges).map((grade, index) => ({
            label: grade,
            data: gradeRanges[grade],
            backgroundColor: this.colors.primary[index % this.colors.primary.length],
            borderColor: this.colors.primary[index % this.colors.primary.length],
            borderWidth: 1
        }));

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.subjects,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '各科目成绩等级分布',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '科目'
                        },
                        stacked: true
                    },
                    y: {
                        title: {
                            display: true,
                            text: '学生人数'
                        },
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // 新增：创建热力图 - 成绩矩阵（用柱状图模拟）
    createHeatmapChart(canvasId) {
        console.log('createHeatmapChart被调用，canvasId:', canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas元素不存在:', canvasId);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        console.log('获取到canvas context:', ctx);
        
        // 计算每个学生的总分并排序
        const studentsWithTotal = this.data.map(student => {
            const name = student['姓名'] || student['name'] || student['学生姓名'];
            const total = this.subjects.reduce((sum, subject) => sum + student[subject], 0);
            return { name, total, ...student };
        }).sort((a, b) => b.total - a.total).slice(0, 10); // 取前10名

        // 为每个科目创建数据集
        const datasets = this.subjects.map((subject, index) => ({
            label: subject,
            data: studentsWithTotal.map(student => student[subject]),
            backgroundColor: this.colors.primary[index % this.colors.primary.length] + '80',
            borderColor: this.colors.primary[index % this.colors.primary.length],
            borderWidth: 1
        }));

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: studentsWithTotal.map(student => student.name),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '前10名学生各科成绩矩阵',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '学生'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '分数'
                        }
                    }
                },
                indexAxis: 'x'
            }
        });
    }

    // 创建学生排名图表（新增）
    createStudentRankingChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const processor = new DataProcessor(this.data);
        const rankings = processor.calculateStudentRankings();
        
        // 取前10名学生
        const top10Students = rankings.slice(0, 10);
        
        const labels = top10Students.map(student => {
            const medal = student.medal || '';
            return `${medal} ${student.name}`;
        });
        
        const scores = top10Students.map(student => student.total);
        const averages = top10Students.map(student => student.average);
        
        // 为前三名使用特殊颜色
        const backgroundColors = top10Students.map((student, index) => {
            if (index === 0) return '#FFD700'; // 金色
            if (index === 1) return '#C0C0C0'; // 银色  
            if (index === 2) return '#CD7F32'; // 铜色
            return this.colors.primary[index % this.colors.primary.length];
        });

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '总分',
                    data: scores,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color + 'CC'),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }, {
                    label: '平均分',
                    data: averages,
                    type: 'line',
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#e74c3c',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '🏆 学生排名榜 (前10名)',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: '总分'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: '平均分'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                    x: {
                        title: {
                            display: true,
                            text: '学生姓名'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutBounce'
                }
            }
        });
    }

    // 创建科目详细统计图表（新增）
    createSubjectStatsChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const processor = new DataProcessor(this.data);
        const subjectStats = processor.calculateSubjectDetailedStats();
        
        const labels = this.subjects;
        const averages = this.subjects.map(subject => subjectStats[subject].average);
        const maxScores = this.subjects.map(subject => subjectStats[subject].max);
        const minScores = this.subjects.map(subject => subjectStats[subject].min);

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '平均分',
                        data: averages,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#3498db',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: '最高分',
                        data: maxScores,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#e74c3c',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: '最低分',
                        data: minScores,
                        borderColor: '#f39c12',
                        backgroundColor: 'rgba(243, 156, 18, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#f39c12',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '📊 各科目成绩统计',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '分数'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '科目'
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    // 创建等级分布图表（新增）
    createGradeDistributionChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const processor = new DataProcessor(this.data);
        const subjectStats = processor.calculateSubjectDetailedStats();
        
        const labels = this.subjects;
        const excellentData = this.subjects.map(subject => subjectStats[subject].excellent.count);
        const goodData = this.subjects.map(subject => subjectStats[subject].good.count);
        const passData = this.subjects.map(subject => subjectStats[subject].pass.count);
        const failData = this.subjects.map(subject => subjectStats[subject].fail.count);

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '优秀 (90-100分)',
                        data: excellentData,
                        backgroundColor: '#2ecc71',
                        borderColor: '#27ae60',
                        borderWidth: 1
                    },
                    {
                        label: '良好 (80-89分)',
                        data: goodData,
                        backgroundColor: '#3498db',
                        borderColor: '#2980b9',
                        borderWidth: 1
                    },
                    {
                        label: '及格 (60-79分)',
                        data: passData,
                        backgroundColor: '#f39c12',
                        borderColor: '#e67e22',
                        borderWidth: 1
                    },
                    {
                        label: '不及格 (<60分)',
                        data: failData,
                        backgroundColor: '#e74c3c',
                        borderColor: '#c0392b',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '📈 各科目等级分布统计',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: '科目'
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '人数'
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutCubic'
                }
            }
        });
    }

    // 创建及格率对比图表（新增）
    createPassRateChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const processor = new DataProcessor(this.data);
        const subjectStats = processor.calculateSubjectDetailedStats();
        
        const labels = this.subjects;
        const excellentRates = this.subjects.map(subject => subjectStats[subject].excellent.rate);
        const goodRates = this.subjects.map(subject => subjectStats[subject].good.rate);
        const passRates = this.subjects.map(subject => subjectStats[subject].passRate);
        const failRates = this.subjects.map(subject => subjectStats[subject].fail.rate);

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: '及格率',
                    data: passRates,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB', 
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ],
                    borderColor: '#fff',
                    borderWidth: 3,
                    hoverBorderWidth: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '🎯 各科目及格率对比',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const dataset = data.datasets[0];
                                        const rate = dataset.data[i];
                                        return {
                                            text: `${label}: ${rate}%`,
                                            fillStyle: dataset.backgroundColor[i],
                                            strokeStyle: dataset.borderColor,
                                            lineWidth: dataset.borderWidth,
                                            pointStyle: 'circle',
                                            hidden: false,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                return `${label}: ${value}%`;
                            }
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutBack'
                }
            }
        });
    }

    // 创建科目排名表格图表（新增）
    createSubjectRankingChart(canvasId, subject) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const processor = new DataProcessor(this.data);
        const subjectRankings = processor.generateSubjectRankings();
        const rankings = subjectRankings[subject] || [];
        
        // 取前10名
        const top10 = rankings.slice(0, 10);
        
        const labels = top10.map(student => {
            const medal = student.medal || '';
            return `${medal} ${student.name}`;
        });
        
        const scores = top10.map(student => student.score);
        
        // 为前三名使用特殊颜色
        const backgroundColors = top10.map((student, index) => {
            if (index === 0) return '#FFD700'; // 金色
            if (index === 1) return '#C0C0C0'; // 银色  
            if (index === 2) return '#CD7F32'; // 铜色
            return this.colors.primary[index % this.colors.primary.length];
        });

        return new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: labels,
                datasets: [{
                    label: `${subject}成绩`,
                    data: scores,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color + 'CC'),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `🏆 ${subject} - 学生排名榜 (前10名)`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '分数'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '学生'
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutBounce'
                }
            }
        });
    }
} 