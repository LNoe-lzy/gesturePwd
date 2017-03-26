/**
 * Created by lizongyuan on 2017/3/25.
 */
;(function (window) {
    window.GesturePwd = function () {
        return new GesturePwd();
    };

    function GesturePwd() {
        // 初始化canvas和context
        this.canvas = null;
        this.context = null;
        // canvas 在屏幕中的偏移量
        this.offTop = 0;
        this.offLeft = 0;
        // 存储圆的半径
        this.r = 0;
        // 存储圆心
        this.points = [];
        // 存储绘制的线路
        this.lines = [];
        // 存储实心圆
        this.disc = [];
        // 缓存每一次的初始绘制点
        this.start = {};
        // 已走过点的数量
        this.lineIndex = 0;
        // 设置当前的状态
        this.status = null;

        this.cacheLines = null;

        this.init();
    }

    GesturePwd.prototype = {
        init: function () {
            this.initStage();
            this.handleEvent();
        },
        // 初始化舞台
        initStage: function () {
            var info = localStorage.getItem('pwd') ? '请输入密码' : '设置手势密码';
            this.status = localStorage.getItem('pwd') ? null : false;
            var stage = document.createElement('div');
            var inner = '<p id="info" style="color: #fff">' + info + '</p>' +
                '<canvas width="300" height="300" id="canvas" style="width: 300px; height: 300px"></canvas>';
            stage.innerHTML = inner;
            document.body.appendChild(stage);
            stage.style['position'] = 'absolute';
            stage.style['top'] = 0;
            stage.style['right'] = 0;
            stage.style['bottom'] = 0;
            stage.style['left'] = 0;
            stage.style['display'] = 'flex';
            stage.style['flex-direction'] = 'column';
            stage.style['align-items'] = 'center';
            stage.style['justify-content'] = 'center';
            stage.style['background'] = '-webkit-gradient(linear, 0 0, 0 bottom, from(rgba(78, 29, 76, 0.8)), to(rgba(25, 202, 173, 0.8)))';

            this.canvas = document.getElementById('canvas');
            this.context = this.canvas.getContext('2d');

            // 初始化圆环
            // 我们令半径和间隔都为一个半径
            this.r = (this.context.canvas.width - 12) / 10;
            // 存储圆心的位置
            for (var i = 0; i < 3; i++) {
                for (var j = 0; j < 3; j++) {
                    var x = (2 + 3 * i) * this.r + (1 + 2 * i) * 2;
                    var y = (2 + 3 * j) * this.r + (1 + 2 * j) * 2;
                    this.points.push({x: x, y: y});
                }
            }

            this.offTop = this.canvas.offsetTop;
            this.offLeft = this.canvas.offsetLeft;

            this.drawCycle();
        },
        // 绘制圆环
        drawCycle: function () {
            var context = this.context;
            for (var i = 0, point; point = this.points[i++];) {
                context.strokeStyle = '#8CC7B5';
                context.lineWidth = 2;
                context.beginPath();
                context.arc(point.x, point.y, this.r, 0, Math.PI * 2);
                context.closePath();
                context.stroke();

            }
        },

        // 绘制线段
        drawLine: function (x, y) {
            var context = this.context;
            context.strokeStyle = '#A0EEE1';
            context.lineWidth = 3;
            context.beginPath();
            context.moveTo(this.start.x, this.start.y);
            context.lineTo(x, y);
            context.closePath();
            context.stroke();
        },

        // 重新绘制路径
        drawLines: function () {
            var context = this.context;
            for (var i = 0, line; line = this.lines[i++];) {
                context.strokeStyle = '#A0EEE1';
                context.lineWidth = 3;
                context.beginPath();
                context.moveTo(line.startX, line.startY);
                context.lineTo(line.endX, line.endY);
                context.closePath();
                context.stroke();
            }
        },

        // 绘制实心圆
        drawDics: function (x, y) {
            var context = this.context;
            context.fillStyle = '#fff';
            context.beginPath();
            context.arc(x, y, this.r / 3, 0, Math.PI * 2);
            context.closePath();
            context.fill();
            context.strokeStyle = '#fff';
            context.lineWidth = 2;
            context.beginPath();
            context.arc(x, y, this.r - 2, 0, Math.PI * 2);
            context.closePath();
            context.stroke();
        },

        // 绘制所有实心圆
        drawDicses: function (color) {
            var context = this.context;
            for (var i = 0, dis; dis = this.disc[i++];) {
                context.fillStyle = color;
                context.beginPath();
                context.arc(dis.x, dis.y, this.r / 3, 0, Math.PI * 2);
                context.closePath();
                context.fill();
                context.strokeStyle = color;
                context.lineWidth = 2;
                context.beginPath();
                context.arc(dis.x, dis.y, this.r - 2, 0, Math.PI * 2);
                context.closePath();
                context.stroke();
            }
        },

        // 刷新canvas
        refresh: function (str) {
            var that = this;
            setTimeout(function () {
                // 清除所有缓存
                that.lines = [];
                that.disc = [];
                that.start = {};
                that.lineIndex = 0;
                that.context.clearRect(0, 0, 300, 300);
                document.getElementById('info').innerHTML = str;
                // 重绘圆环
                that.drawCycle();
            }, 300);
        },

        // 处理触摸事件
        handleEvent: function () {
            var that = this;
            EventUtil.addEvent(this.canvas, 'touchstart', function (e) {
                e = EventUtil.getEvent(e);
                EventUtil.preventDefault(e);
                var x = e.touches[0].clientX - that.offLeft;
                var y = e.touches[0].clientY - that.offTop;
                // 判断是否落在了圆心中
                if (that.isInCycle(x, y)) {
                    var cx = that.isInCycle(x, y).x;
                    var cy = that.isInCycle(x, y).y;
                    that.start.x = cx;
                    that.start.y = cy;
                    that.lines.push({
                        startX: cx,
                        startY: cy,
                        endX: cx,
                        endY: cy
                    });

                    // 绘制并保存实心圆
                    that.drawDics(cx, cy);
                    that.disc.push({
                        x: cx,
                        y: cy
                    });
                }
            });

            EventUtil.addEvent(this.canvas, 'touchmove', function (e) {
                e = EventUtil.getEvent(e);
                EventUtil.preventDefault(e);
                var x = e.touches[0].clientX - that.offLeft;
                var y = e.touches[0].clientY - that.offTop;
                // 每一次绘制前需要清除原来的多余线
                that.context.clearRect(0, 0, 300, 300);
                // 重新渲染圆
                that.drawCycle();
                // 重绘已经存在的路径
                that.drawLines();
                // 重绘实心圆
                that.drawDicses('#fff');

                // 每次触发移动事件都要判断是否落在圆环中
                if (that.isInCycle(x, y)) {
                    var cx = that.isInCycle(x, y).x;
                    var cy = that.isInCycle(x, y).y;
                    // 是否存在重复经过的点
                    if (that.isNotInLines(cx, cy)) {
                        // 绘制当前经过的点
                        that.lines[that.lineIndex].endX = cx;
                        that.lines[that.lineIndex].endY = cy;
                        that.lineIndex++;
                        // 如果处于圆心中且不是重复的点就将其存储在路径数组中并更新新的画笔指针
                        that.start.x = cx;
                        that.start.y = cy;
                        that.lines.push({
                            startX: cx,
                            startY: cy,
                            endX: cx,
                            endY: cy
                        });

                        // 绘制并保存实心圆
                        that.drawDics(cx, cy);
                        that.disc.push({
                            x: cx,
                            y: cy
                        });
                    }
                }

                // 绘制新的线
                that.drawLine(x, y);

            });


            EventUtil.addEvent(this.canvas, 'touchend', function (e) {
                e = EventUtil.getEvent(e);
                EventUtil.preventDefault(e);
                that.context.clearRect(0, 0, 300, 300);
                // 重绘圆环
                that.drawCycle();
                // 重绘已经存在的路径
                that.drawLines();
                // 重绘实心圆
                that.drawDicses('#fff');

                var info = document.getElementById('info');
                if (!localStorage.getItem('pwd')) {
                    if (that.lines.length <= 3 && that.lines.length > 0) {
                        info.innerHTML = '密码长度至少为4';

                        that.refresh('请输入密码');
                    } else if (that.lines.length <= 0) {
                        return;
                    } else {
                        var curLines = JSON.stringify(that.lines);
                        if (that.status) {
                            if (that.cacheLines === curLines) {
                                localStorage.setItem('pwd', JSON.stringify(that.lines));
                                info.innerHTML = '密码绘制成功';
                                that.cacheLines = null;
                                that.refresh('请输入密码');
                            } else {
                                info.innerHTML = '两次输入的密码不一致';
                                that.cacheLines = null;
                                that.status = false;
                                that.refresh('设置手势密码');
                            }
                        } else {
                            that.cacheLines = JSON.stringify(that.lines);
                            that.status = true;
                            that.refresh('请再次输入密码');
                        }
                    }
                } else {
                    if (JSON.stringify(that.lines) !== localStorage.getItem('pwd')) {
                        that.drawDicses('red');
                        info.innerHTML = '密码错误';

                        that.refresh('请输入密码');
                    } else {
                        info.innerHTML = '密码正确';

                        that.refresh('请输入密码');
                    }
                }
            });
        },

        // 判断当前的触摸点是否在圆心的范围内
        isInCycle: function (x, y) {
            var r = this.r;
            for (var i = 0, point; point = this.points[i++];) {
                var rangeXmin = point.x - r;
                var rangeXmax = point.x + r;
                var rangeYmin = point.y - r;
                var rangeYmax = point.y + r;
                if (x > rangeXmin && y > rangeYmin && x < rangeXmax && y < rangeYmax) {
                    return point;
                }
            }
            return false;
        },

        // 判读是否经过重复点
        isNotInLines: function (x, y) {
            for (var i = 0, line; line = this.lines[i++];) {
                if (x === line.startX && y === line.startY) {
                    return false;
                }
            }
            return true;
        }
    };

    // 事件处理函数
    var EventUtil = (function () {
        var getEvent = function (e) {
            return e ? e : window.event;
        };

        var getTarget = function (e) {
            return e.target || e.srcElement;
        };

        var preventDefault = function (e) {
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
        };

        var stopPropagation = function (e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            } else {
                e.cancelBubble = true;
            }
        };

        var addEvent = function (elem, type, handler) {
            if (elem.addEventListener) {
                addEvent = function (elem, type, handler) {
                    elem.addEventListener(type, handler);
                }
            } else {
                addEvent = function (elem, type, handler) {
                    elem.attachEvent('on' + type, handler);
                }
            }
            addEvent(elem, type, handler);
        };

        var removeEvent = function (elem, type, handler) {
            if (elem.removeEventListener) {
                removeEvent = function (elem, type, handler) {
                    elem.removeEventListener(type, handler);
                }
            } else {
                removeEvent = function (elem, type, handler) {
                    elem.datachEvent('on' + type, handler);
                }
            }
            removeEvent(elem, type, handler);
        };

        return {
            getTarget: getTarget,
            getEvent: getEvent,
            preventDefault: preventDefault,
            stopPropagation: stopPropagation,
            addEvent: addEvent,
            removeEvent: removeEvent
        };
    })();

})(window);