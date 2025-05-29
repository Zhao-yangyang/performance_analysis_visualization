// 图表管理器类
class ChartManager {
    constructor(data) {
        this.data = data;
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
            key !== '姓名' && key !== 'name' && key !== '学生姓名'
        );
    }

    // 创建柱状图 - 各科目平均分
    createBarChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const averages = this.subjects.map(subject => {
            const total = this.data.reduce((sum, student) => sum + student[subject], 0);
            return (total / this.data.length).toFixed(1);
        });

        return new Chart(ctx, {
            type: 'bar',
            data: {
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
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '各科目平均分对比',
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
                        max: 100,
                        ticks: {
                            stepSize: 10
                        },
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
                    easing: 'easeInOutBounce'
                }
            }
        });
    }

    // 创建折线图 - 学生成绩趋势
    createLineChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
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

        return new Chart(ctx, {
            type: 'line',
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
                        text: '学生成绩趋势对比（前6名学生）',
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
                        max: 100,
                        ticks: {
                            stepSize: 10
                        },
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

    // 创建饼图 - 成绩等级分布
    createPieChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
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

        const labels = Object.keys(grades);
        const data = Object.values(grades);

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: this.colors.primary,
                    borderColor: '#fff',
                    borderWidth: 3,
                    hoverBorderWidth: 4,
                    hoverBorderColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '成绩等级分布',
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
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed * 100) / total).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '50%',
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 2000
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
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const scatterData = this.data.map(student => {
            const studentName = student['姓名'] || student['name'] || student['学生姓名'];
            return {
                x: student[subjectX],
                y: student[subjectY],
                label: studentName
            };
        });

        return new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: `${subjectX} vs ${subjectY}`,
                    data: scatterData,
                    backgroundColor: '#667eea',
                    borderColor: '#764ba2',
                    pointRadius: 8,
                    pointHoverRadius: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${subjectX} 与 ${subjectY} 相关性分析`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.raw.label}: (${context.parsed.x}, ${context.parsed.y})`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: subjectX
                        },
                        min: 0,
                        max: 100
                    },
                    y: {
                        title: {
                            display: true,
                            text: subjectY
                        },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    }

    // 创建混合图表 - 成绩分布与平均线
    createMixedChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const studentNames = this.data.map(student => 
            student['姓名'] || student['name'] || student['学生姓名']
        );
        
        const totalScores = this.data.map(student => 
            this.subjects.reduce((sum, subject) => sum + student[subject], 0)
        );
        
        const average = totalScores.reduce((a, b) => a + b, 0) / totalScores.length;
        const averageLine = new Array(totalScores.length).fill(average);

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: studentNames,
                datasets: [
                    {
                        type: 'bar',
                        label: '总分',
                        data: totalScores,
                        backgroundColor: '#667eea60',
                        borderColor: '#667eea',
                        borderWidth: 2,
                        borderRadius: 6
                    },
                    {
                        type: 'line',
                        label: '平均分',
                        data: averageLine,
                        borderColor: '#f5576c',
                        backgroundColor: '#f5576c20',
                        borderWidth: 3,
                        fill: false,
                        tension: 0,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '学生总分分布与平均线',
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
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '总分'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '学生'
                        }
                    }
                }
            }
        });
    }
} 