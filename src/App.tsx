import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, History, TrendingUp, Calendar, Activity, Award, Clock, Hand, Zap, Brain } from 'lucide-react';

const App = () => {
  const [records, setRecords] = useState([]);
  const [leftValue, setLeftValue] = useState('');
  const [rightValue, setRightValue] = useState('');
  const [fatigue, setFatigue] = useState(3); // 默认中等
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());

  // 定义疲劳等级及其样式属性
  const fatigueLevels = useMemo(() => [
    { 
      level: 1, 
      label: '极佳', 
      emoji: '🤩', 
      theme: 'from-green-400 to-emerald-500', 
      shadow: 'shadow-green-200', 
      bg: 'bg-green-50',
      textColor: 'text-green-600',
      dotColor: 'bg-green-500'
    },
    { 
      level: 2, 
      label: '良好', 
      emoji: '😊', 
      theme: 'from-emerald-400 to-teal-500', 
      shadow: 'shadow-emerald-200', 
      bg: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      dotColor: 'bg-emerald-500'
    },
    { 
      level: 3, 
      label: '一般', 
      emoji: '😐', 
      theme: 'from-amber-400 to-orange-500', 
      shadow: 'shadow-amber-200', 
      bg: 'bg-amber-50',
      textColor: 'text-amber-600',
      dotColor: 'bg-amber-500'
    },
    { 
      level: 4, 
      label: '疲劳', 
      emoji: '😫', 
      theme: 'from-orange-400 to-red-500', 
      shadow: 'shadow-orange-200', 
      bg: 'bg-orange-50',
      textColor: 'text-orange-600',
      dotColor: 'bg-orange-500'
    },
    { 
      level: 5, 
      label: '极累', 
      emoji: '💀', 
      theme: 'from-red-500 to-rose-700', 
      shadow: 'shadow-red-200', 
      bg: 'bg-red-50',
      textColor: 'text-red-600',
      dotColor: 'bg-red-500'
    },
  ], []);

  // 辅助函数：安全获取疲劳等级配置
  const getFatigueConfig = (level) => {
    return fatigueLevels.find(l => l.level === level) || fatigueLevels[2];
  };

  useEffect(() => {
    const mockData = [
      { id: 1, date: '03-10', left: 38.5, right: 40.0, fatigue: 2 },
      { id: 2, date: '03-12', left: 40.2, right: 41.5, fatigue: 3 },
      { id: 3, date: '03-14', left: 41.0, right: 43.2, fatigue: 1 },
      { id: 4, date: '03-15', left: 43.5, right: 44.1, fatigue: 4 },
      { id: 5, date: '03-17', left: 42.8, right: 45.6, fatigue: 2 },
    ];
    setRecords(mockData);
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const addRecord = (e) => {
    e.preventDefault();
    if (!leftValue || !rightValue) return;

    const now = new Date();
    const newRecord = {
      id: Date.now(),
      date: `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`,
      left: parseFloat(leftValue),
      right: parseFloat(rightValue),
      fatigue: fatigue,
      fullDate: now.toISOString()
    };

    setRecords([...records, newRecord]);
    setLeftValue('');
    setRightValue('');
    setFatigue(3);
  };

  const deleteRecord = (id) => {
    setRecords(records.filter(r => r.id !== id));
  };

  const stats = useMemo(() => {
    if (records.length === 0) return { maxL: 0, maxR: 0, avgFatigue: 0 };
    const maxL = Math.max(...records.map(r => r.left));
    const maxR = Math.max(...records.map(r => r.right));
    const avgFatigue = (records.reduce((a, b) => a + b.fatigue, 0) / records.length).toFixed(1);
    return { maxL, maxR, avgFatigue };
  }, [records]);

  // 趋势图组件（带交互查看功能）
  const LineChart = ({ data }) => {
    const [activeIndex, setActiveIndex] = useState(null);
    
    if (data.length < 2) return (
      <div className="h-40 flex items-center justify-center text-slate-400 text-sm italic">
        需要至少两条记录来生成趋势图
      </div>
    );

    const width = 300;
    const height = 160;
    const padding = 25;
    
    const gripValues = data.flatMap(d => [d.left, d.right]);
    const minGrip = Math.min(...gripValues);
    const maxGrip = Math.max(...gripValues);
    const gripRange = maxGrip - minGrip || 10;

    const getX = (i) => (i / (data.length - 1)) * (width - padding * 2) + padding;
    const getY = (val) => height - ((val - (minGrip - 5)) / (gripRange + 10)) * (height - padding * 2) - padding;
    const getFatigueY = (f) => {
        const normalized = (5 - f) / 4; 
        return height - (normalized * (height - padding * 2) + padding);
    };

    const createPath = (key, isFatigue = false) => {
      return data.map((d, i) => {
        const x = getX(i);
        const y = isFatigue ? getFatigueY(d[key]) : getY(d[key]);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ');
    };

    const activePoint = activeIndex !== null ? data[activeIndex] : null;

    return (
      <div className="w-full relative group">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto drop-shadow-xl"
          onClick={() => setActiveIndex(null)}
        >
          {/* 网格线 */}
          <line x1={padding} y1={padding} x2={padding} y2={height-padding} stroke="#f1f5f9" strokeWidth="1" />
          <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#f1f5f9" strokeWidth="1" />
          
          {/* 疲劳区域 */}
          <path d={`${createPath('fatigue', true)} L ${getX(data.length-1)} ${height-padding} L ${getX(0)} ${height-padding} Z`} fill="rgba(245, 158, 11, 0.03)" stroke="none" />

          {/* 数据线 */}
          <path d={createPath('left')} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d={createPath('right')} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d={createPath('fatigue', true)} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" opacity="0.6" />
          
          {/* 指示线 */}
          {activeIndex !== null && (
            <line 
              x1={getX(activeIndex)} y1={padding} x2={getX(activeIndex)} y2={height-padding} 
              stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 2"
            />
          )}

          {/* 数据点 */}
          {data.map((d, i) => (
            <React.Fragment key={i}>
              <circle cx={getX(i)} cy={getY(d.left)} r={activeIndex === i ? "4" : "3"} fill="#3b82f6" stroke="white" strokeWidth="1" />
              <circle cx={getX(i)} cy={getY(d.right)} r={activeIndex === i ? "4" : "3"} fill="#8b5cf6" stroke="white" strokeWidth="1" />
              <circle cx={getX(i)} cy={getFatigueY(d.fatigue)} r="2" fill="#f59e0b" />
              
              {/* 点击感应区 (透明大按钮) */}
              <rect 
                x={getX(i) - (width/data.length)/2} 
                y="0" 
                width={width/data.length} 
                height={height} 
                fill="transparent" 
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(i);
                }}
              />
            </React.Fragment>
          ))}
        </svg>

        {/* 交互提示框 (Tooltip) */}
        {activeIndex !== null && activePoint && (
          <div 
            className="absolute top-0 pointer-events-none transition-all duration-300 ease-out"
            style={{ 
              left: `${(getX(activeIndex) / width) * 100}%`,
              transform: `translateX(-50%) translateY(-100%)`,
              marginTop: '-10px'
            }}
          >
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-2xl min-w-[120px]">
              <div className="text-[10px] font-black text-slate-400 mb-2 uppercase flex justify-between">
                <span>{activePoint.date}</span>
                <span className="text-amber-500">{getFatigueConfig(activePoint.fatigue).emoji}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[10px] font-bold text-blue-600">左手</span>
                  <span className="font-black text-sm">{activePoint.left}<span className="text-[8px] ml-0.5">kg</span></span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[10px] font-bold text-purple-600">右手</span>
                  <span className="font-black text-sm">{activePoint.right}<span className="text-[8px] ml-0.5">kg</span></span>
                </div>
              </div>
            </div>
            {/* 提示框下的小箭头 */}
            <div className="w-2 h-2 bg-white/90 rotate-45 border-r border-b border-slate-200 mx-auto -mt-1 shadow-sm"></div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 px-2 mt-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
           <div className="flex items-center gap-1.5"><div className="w-2 h-0.5 bg-blue-500 rounded-full"></div> 左手</div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-0.5 bg-purple-500 rounded-full"></div> 右手</div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-0.5 border-t border-dashed border-amber-500"></div> 疲劳</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100 pb-20">
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-100/30 blur-[120px] rounded-full -z-10"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-100/30 blur-[120px] rounded-full -z-10"></div>

      <header className="px-6 pt-10 pb-4 max-w-lg mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">力量记录</h1>
          <p className="text-slate-400 text-xs font-bold mt-1 flex items-center gap-1 capitalize">
            <Calendar className="w-3 h-3" />
            {currentTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
        </div>
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
          <Activity className="w-6 h-6 text-blue-500" />
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-6">
        
        {activeTab === 'dashboard' ? (
          <div className="space-y-6 animate-in fade-in duration-700 slide-in-from-bottom-2">
            
            <section className="bg-white/60 backdrop-blur-3xl border border-white p-7 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-visible">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black flex items-center gap-2 text-slate-800">
                  <Plus className="w-4 h-4 text-blue-500" /> 开启新记录
                </h3>
                <div className="px-2 py-1 bg-blue-50 text-[10px] font-black text-blue-600 rounded-lg uppercase tracking-wider">Today</div>
              </div>
              
              <form onSubmit={addRecord} className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2 group">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                      <Hand className="w-3 h-3 transform -scale-x-100" /> 左手 (kg)
                    </div>
                    <input 
                      type="number" step="0.1" value={leftValue} onChange={e => setLeftValue(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-5 px-2 text-center text-3xl font-black outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all shadow-inner"
                      placeholder="0.0"
                    />
                  </div>
                  <div className="flex-1 space-y-2 group">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                      <Hand className="w-3 h-3" /> 右手 (kg)
                    </div>
                    <input 
                      type="number" step="0.1" value={rightValue} onChange={e => setRightValue(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-5 px-2 text-center text-3xl font-black outline-none focus:ring-4 focus:ring-purple-500/10 focus:bg-white transition-all shadow-inner"
                      placeholder="0.0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                      <Zap className="w-3 h-3 text-amber-500 animate-pulse" /> 身体状态感知
                   </div>
                   <div className="flex justify-between gap-2 px-1 py-6">
                      {fatigueLevels.map((lvl) => (
                        <button
                          key={lvl.level}
                          type="button"
                          onClick={() => setFatigue(lvl.level)}
                          className={`flex-1 flex flex-col items-center py-4 rounded-[1.5rem] transition-all duration-500 relative ${
                            fatigue === lvl.level 
                            ? `bg-white border-white ${lvl.shadow} shadow-2xl scale-110 -translate-y-1 z-10` 
                            : 'bg-slate-50/40 border-transparent opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                          } border`}
                        >
                          {fatigue === lvl.level && (
                            <div className={`absolute inset-0 bg-gradient-to-br ${lvl.theme} opacity-5 rounded-[1.5rem]`}></div>
                          )}
                          
                          <span className={`text-2xl mb-2 transition-transform duration-500 ${fatigue === lvl.level ? 'scale-125' : 'scale-100'}`}>
                            {lvl.emoji}
                          </span>
                          <span className={`text-[10px] font-black tracking-tighter ${fatigue === lvl.level ? 'text-slate-800' : 'text-slate-400'}`}>
                            {lvl.label}
                          </span>
                          
                          {fatigue === lvl.level && (
                            <div className={`w-1 h-1 rounded-full mt-1 bg-gradient-to-r ${lvl.theme}`}></div>
                          )}
                        </button>
                      ))}
                   </div>
                </div>

                <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-[1.8rem] font-black shadow-xl shadow-slate-300 active:scale-[0.98] transition-all mt-8 text-sm tracking-widest uppercase text-center">
                  确认并存入档案
                </button>
              </form>
            </section>

            <section className="bg-white/80 backdrop-blur-2xl border border-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/40">
              <div className="flex justify-between items-center mb-6 px-1">
                <h2 className="text-sm font-black flex items-center gap-2 text-slate-800 uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4 text-blue-500" /> 力量趋势图
                </h2>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter italic">点击查看详情</p>
              </div>
              <LineChart data={records.slice(-7)} />
            </section>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2.2rem] border border-white shadow-sm flex flex-col items-center group active:scale-95 transition-all">
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-2">Max Left</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-blue-600 tracking-tighter">{stats.maxL}</span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase">kg</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2.2rem] border border-white shadow-sm flex flex-col items-center group active:scale-95 transition-all">
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-2">Max Right</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-purple-600 tracking-tighter">{stats.maxR}</span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase">kg</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-end px-4 mb-2">
              <h2 className="text-2xl font-black text-slate-800">历史档案</h2>
              <div className="text-[9px] font-black bg-slate-100 px-3 py-1.5 rounded-full text-slate-400 uppercase tracking-widest font-mono">History Log</div>
            </div>
            
            <div className="space-y-3">
              {[...records].reverse().map((record) => {
                const config = getFatigueConfig(record.fatigue);
                return (
                  <div key={record.id} className="bg-white/70 backdrop-blur-md p-5 rounded-[2.2rem] shadow-sm border border-white flex items-center justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50/50 flex items-center justify-center text-2xl shadow-inner group-hover:bg-white transition-colors border border-slate-100">
                        {config.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-800 tracking-tight text-sm">{record.date}</p>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${config.bg} ${config.textColor}`}>
                            {config.label}
                          </span>
                        </div>
                        <div className="flex gap-4 mt-2">
                          <span className="text-[11px] font-bold text-blue-500 flex items-center gap-1">
                            <Hand className="w-3 h-3 transform -scale-x-100" /> {record.left}
                          </span>
                          <span className="text-[11px] font-bold text-purple-500 flex items-center gap-1">
                            <Hand className="w-3 h-3" /> {record.right}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => deleteRecord(record.id)} className="p-3 text-slate-200 hover:text-red-400 hover:bg-red-50 rounded-full transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[85%] max-w-sm bg-white/80 backdrop-blur-3xl border border-white/50 p-2 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex justify-between z-50">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-full transition-all duration-500 ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-xl shadow-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Activity className="w-5 h-5" />
          {activeTab === 'dashboard' && <span className="text-xs font-black tracking-tight ml-2">主页</span>}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-full transition-all duration-500 ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-xl shadow-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <History className="w-5 h-5" />
          {activeTab === 'history' && <span className="text-xs font-black tracking-tight ml-2">档案</span>}
        </button>
      </nav>
    </div>
  );
};

export default App;
