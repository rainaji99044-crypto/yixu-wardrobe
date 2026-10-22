'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ChevronLeft,
  Download,
  LayoutDashboard,
  Lightbulb,
  Layers3,
  Settings2,
  Shirt,
  Trash2,
  Upload,
} from 'lucide-react';
import type {AppSettings, ClothingItem, Inspiration, MonthlyReview, Outfit} from '@/lib/models';
import {
  clearAll,
  exportBackup,
  getAll,
  importBackup,
  settings,
} from '@/lib/db';
import {ClosetPage} from './closet-page';
import {OutfitsPage} from './outfits-page';
import {InspirationPage} from './inspiration-page';
import {DashboardPage} from './dashboard-page';
import {Confirm, Modal} from './common';

type Page = 'closet' | 'outfits' | 'inspiration' | 'dashboard';
type WardrobeData = {
  clothing: ClothingItem[];
  outfits: Outfit[];
  inspirations: Inspiration[];
  reviews: MonthlyReview[];
  settings: AppSettings;
  reload: () => Promise<void>;
  notice: (message: string) => void;
};

const WardrobeContext = createContext<WardrobeData | null>(null);

export function useWardrobe() {
  const value = useContext(WardrobeContext);
  if (!value) throw new Error('useWardrobe 必须在 WardrobeApp 中使用');
  return value;
}

const navigation = [
  ['closet', '衣橱', Shirt],
  ['outfits', '穿搭', Layers3],
  ['inspiration', '灵感', Lightbulb],
  ['dashboard', '看板', LayoutDashboard],
] as const;

export default function WardrobeApp() {
  const [page, setPage] = useState<Page>('closet');
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [manage, setManage] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [data, setData] = useState({
    clothing: [] as ClothingItem[], outfits: [] as Outfit[], inspirations: [] as Inspiration[], reviews: [] as MonthlyReview[],
    settings: {id: 'settings', idleDays: 90, customCategories: [], theme: 'light'} as AppSettings,
  });

  async function reload() {
    try {
      const clothing = await getAll<ClothingItem>('clothing');
      const outfits = await getAll<Outfit>('outfits');
      const inspirations = await getAll<Inspiration>('inspirations');
      const reviews = await getAll<MonthlyReview>('reviews');
      const appSettings = await settings();
      setData({clothing, outfits, inspirations, reviews, settings: appSettings});
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '无法打开本地数据库');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    const route = location.hash.slice(1) as Page;
    if (navigation.some(([key]) => key === route)) setPage(route);
  }, []);

  function notice(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  }

  function go(next: Page) {
    setPage(next);
    location.hash = next;
  }

  async function backup() {
    try {
      const value = await exportBackup();
      const blob = new Blob([JSON.stringify(value)], {type: 'application/json'});
      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(blob);
      anchor.download = `衣序备份-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(anchor.href);
      notice('备份已导出');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '备份失败');
    }
  }

  async function restore(file?: File) {
    if (!file) return;
    try {
      await importBackup(JSON.parse(await file.text()));
      await reload();
      setManage(false);
      notice('备份已恢复');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '导入失败');
    }
  }

  const contextValue = useMemo(
    () => ({...data, reload, notice}),
    [data],
  );

  return (
    <WardrobeContext.Provider value={contextValue}>
      <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
        <header className="mobile-header">
          <Brand />
          <button className="icon-button" onClick={() => setManage(true)} aria-label="数据设置">
            <Settings2 />
          </button>
        </header>

        <aside className="sidebar">
          <div className="sidebar-top">
            <Brand />
            <button
              className="icon-button collapse"
              onClick={() => setCollapsed(value => !value)}
              aria-label={collapsed ? '展开导航' : '折叠导航'}
            >
              <ChevronLeft />
            </button>
          </div>
          <nav aria-label="主要导航">
            {navigation.map(([key, label, Icon]) => (
              <button key={key} className={`nav-item ${page === key ? 'active' : ''}`} onClick={() => go(key)}>
                <Icon />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-quote">
            <Lightbulb />
            <b>让喜欢，被常常穿起</b>
            <p>先把衣橱整理清楚，再慢慢形成自己的穿搭语言。</p>
          </div>
          <button className="nav-item settings-link" onClick={() => setManage(true)}>
            <Settings2 />
            <span>数据与设置</span>
          </button>
        </aside>

        <main className="app-main">
          {loading ? (
            <div className="loading">正在打开你的衣橱…</div>
          ) : error ? (
            <div className="error-banner" role="alert">
              {error}
              <button onClick={() => void reload()}>重试</button>
            </div>
          ) : page === 'closet' ? <ClosetPage />
            : page === 'outfits' ? <OutfitsPage />
            : page === 'inspiration' ? <InspirationPage />
            : <DashboardPage onGo={go} />}
        </main>

        <nav className="bottom-nav" aria-label="手机导航">
          {navigation.map(([key, label, Icon]) => (
            <button key={key} className={page === key ? 'active' : ''} onClick={() => go(key)}>
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {manage && (
        <Modal title="数据与设置" description="衣物资料仅保存在当前浏览器。" onClose={() => setManage(false)}>
          <div className="settings-stack">
            <button className="setting-row" onClick={() => void backup()}>
              <Download />
              <span><b>导出本地备份</b><small>为后续迁移与恢复预留的数据接口</small></span>
            </button>
            <label className="setting-row">
              <Upload />
              <span><b>导入备份</b><small>导入会替换当前浏览器中的衣序数据</small></span>
              <input hidden type="file" accept="application/json" onChange={event => void restore(event.target.files?.[0])} />
            </label>
            <button className="setting-row danger-text" onClick={() => setConfirmClear(true)}>
              <Trash2 />
              <span><b>清空本地数据</b><small>删除前会再次确认</small></span>
            </button>
          </div>
        </Modal>
      )}

      {confirmClear && (
        <Confirm
          title="清空全部本地数据？"
          body="当前浏览器中的衣物图片和资料会被永久删除。建议先导出备份。"
          confirmLabel="确认清空"
          onClose={() => setConfirmClear(false)}
          onConfirm={() => void (async () => {
            await clearAll();
            await reload();
            setConfirmClear(false);
            setManage(false);
            notice('本地数据已清空');
          })()}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </WardrobeContext.Provider>
  );
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark"><Shirt /></span>
      <span><b>衣序</b><small>YIXU WARDROBE</small></span>
    </div>
  );
}
