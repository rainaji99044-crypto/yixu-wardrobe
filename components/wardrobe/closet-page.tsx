'use client';

import {useMemo, useState} from 'react';
import {
  CalendarDays,
  Camera,
  Check,
  Heart,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Shirt,
  Trash2,
  X,
} from 'lucide-react';
import {
  BASE_CATEGORIES,
  COLORS,
  type ClothingItem,
  type ClothingStatus,
} from '@/lib/models';
import {compressImage} from '@/lib/images';
import {put, remove} from '@/lib/db';
import {useWardrobe} from './app';
import {BlobImage, Confirm, EmptyState, Modal} from './common';

const SEASON_OPTIONS = ['春季', '夏季', '秋季', '冬季'] as const;
const LEGACY_SEASONS: Record<string, string> = {
  春: '春季', 夏: '夏季', 秋: '秋季', 冬: '冬季', 四季: '四季通用',
};
type SortKey = 'recent' | 'name' | 'wearCount' | 'lastWorn';

function newItem(): Partial<ClothingItem> {
  return {
    name: '',
    category: '',
    color: '',
    seasons: [],
    styles: [],
    brand: '',
    purchaseDate: '',
    notes: '',
    statuses: [],
    wearCount: 0,
  };
}

function normalizedSeasons(item: ClothingItem) {
  return item.seasons.map(value => LEGACY_SEASONS[value] ?? value);
}

export function ClosetPage() {
  const {clothing, settings, reload, notice} = useWardrobe();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const [seasons, setSeasons] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('recent');
  const [detail, setDetail] = useState<ClothingItem | null>(null);
  const [draft, setDraft] = useState<Partial<ClothingItem> | null>(null);
  const [deleting, setDeleting] = useState<ClothingItem | null>(null);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const categories = [...BASE_CATEGORIES, ...settings.customCategories];

  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('zh-CN');
    return clothing
      .filter(item => {
        const haystack = [item.name, item.brand, item.color, item.notes].join(' ').toLocaleLowerCase('zh-CN');
        const matchesSearch = !term || haystack.includes(term);
        const matchesCategory = category === '全部' || item.category === category;
        const itemSeasons = normalizedSeasons(item);
        const matchesSeason = seasons.length === 0 || seasons.some(value => itemSeasons.includes(value));
        return matchesSearch && matchesCategory && matchesSeason;
      })
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name, 'zh-CN');
        if (sort === 'wearCount') return b.wearCount - a.wearCount || b.createdAt.localeCompare(a.createdAt);
        if (sort === 'lastWorn') {
          if (!a.lastWornDate && !b.lastWornDate) return b.createdAt.localeCompare(a.createdAt);
          if (!a.lastWornDate) return 1;
          if (!b.lastWornDate) return -1;
          return b.lastWornDate.localeCompare(a.lastWornDate);
        }
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [clothing, query, category, seasons, sort]);

  function beginAdd() {
    setFormError('');
    setDraft(newItem());
  }

  function beginEdit(item: ClothingItem) {
    setDetail(null);
    setFormError('');
    setDraft({...item, seasons: normalizedSeasons(item)});
  }

  async function chooseImage(file?: File) {
    if (!file) return;
    try {
      const image = await compressImage(file);
      setDraft(current => current ? {...current, image} : current);
      setFormError('');
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : '图片读取失败');
    }
  }

  async function save() {
    if (!draft) return;
    if (!draft.name?.trim()) return setFormError('请填写衣物名称');
    if (!draft.category) return setFormError('请选择衣物类别');
    if (!draft.image) return setFormError('请上传衣物图片');
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const item: ClothingItem = {
        id: draft.id ?? crypto.randomUUID(),
        name: draft.name.trim(),
        image: draft.image,
        category: draft.category,
        color: draft.color?.trim() ?? '',
        seasons: draft.seasons ?? [],
        styles: draft.styles ?? [],
        brand: draft.brand?.trim() ?? '',
        purchaseDate: draft.purchaseDate ?? '',
        price: draft.price,
        notes: draft.notes?.trim() ?? '',
        statuses: draft.statuses ?? [],
        wearCount: draft.wearCount ?? 0,
        lastWornDate: draft.lastWornDate,
        createdAt: draft.createdAt ?? now,
        updatedAt: now,
      };
      await put('clothing', item);
      await reload();
      setDraft(null);
      notice(draft.id ? '衣物已更新' : '衣物已加入衣橱');
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : '保存失败，请重试');
    } finally {
      setBusy(false);
    }
  }

  async function toggleFavorite(item: ClothingItem) {
    const favorite = item.statuses.includes('收藏');
    const statuses = favorite
      ? item.statuses.filter(value => value !== '收藏')
      : [...item.statuses, '收藏' as ClothingStatus];
    try {
      const next = {...item, statuses, updatedAt: new Date().toISOString()};
      await put('clothing', next);
      await reload();
      setDetail(next);
      notice(favorite ? '已取消收藏' : '已收藏');
    } catch (cause) {
      notice(cause instanceof Error ? cause.message : '操作失败');
    }
  }

  async function recordWear(item: ClothingItem) {
    if (busy) return;
    setBusy(true);
    try {
      const next = {
        ...item,
        wearCount: item.wearCount + 1,
        lastWornDate: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString(),
      };
      await put('clothing', next);
      await reload();
      setDetail(next);
      notice('已记录一次穿着');
    } catch (cause) {
      notice(cause instanceof Error ? cause.message : '记录失败');
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem() {
    if (!deleting) return;
    try {
      await remove('clothing', deleting.id);
      await reload();
      setDetail(null);
      setDeleting(null);
      notice('衣物已删除');
    } catch (cause) {
      notice(cause instanceof Error ? cause.message : '删除失败');
    }
  }

  function toggleSeason(value: string) {
    setSeasons(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  }

  return (
    <>
      <div className="page-heading closet-heading">
        <div>
          <span className="eyebrow">WARDROBE</span>
          <h1>我的衣橱</h1>
          <p>整理已有衣物，让每件衣服都有自己的位置。</p>
        </div>
        <button className="button primary" onClick={beginAdd}><Plus />添加衣物</button>
      </div>

      <section className="closet-controls" aria-label="衣橱筛选">
        <div className="control-row search-sort-row">
          <label className="search-box">
            <Search />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="搜索名称、品牌、颜色或备注"
              aria-label="搜索衣物"
            />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="清空搜索"><X /></button>}
          </label>
          <label className="sort-control">
            <span>排序</span>
            <select value={sort} onChange={event => setSort(event.target.value as SortKey)}>
              <option value="recent">最近添加</option>
              <option value="name">名称</option>
              <option value="wearCount">穿着次数</option>
              <option value="lastWorn">最后穿着时间</option>
            </select>
          </label>
        </div>

        <div className="filter-block">
          <div className="filter-label"><span>季节</span>{seasons.length > 0 && <button onClick={() => setSeasons([])}>清除</button>}</div>
          <div className="filter-chips horizontal-scroll">
            <button className={seasons.length === 0 ? 'active' : ''} onClick={() => setSeasons([])}>全部</button>
            {SEASON_OPTIONS.map(value => (
              <button key={value} className={seasons.includes(value) ? 'active' : ''} onClick={() => toggleSeason(value)}>
                {seasons.includes(value) && <Check />}{value}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-block">
          <div className="filter-label"><span>分类</span></div>
          <div className="filter-chips horizontal-scroll">
            {['全部', ...categories].map(value => (
              <button key={value} className={category === value ? 'active' : ''} onClick={() => setCategory(value)}>{value}</button>
            ))}
          </div>
        </div>
      </section>

      <div className="results-line">
        <span>{results.length} 件衣物</span>
        {(query || category !== '全部' || seasons.length > 0) && <span>已应用筛选</span>}
      </div>

      {results.length ? (
        <div className="clothes-grid">
          {results.map(item => (
            <article className="clothing-card" key={item.id}>
              <button className="card-photo" onClick={() => setDetail(item)} aria-label={`查看${item.name}`}>
                <BlobImage blob={item.image} alt={item.name} />
                {item.statuses.includes('收藏') && <Heart className="card-favorite" fill="currentColor" />}
              </button>
              <button className="card-summary" onClick={() => setDetail(item)}>
                <strong>{item.name}</strong>
                <span>{item.category}{item.color ? ` · ${item.color}` : ''}</span>
                <span>{normalizedSeasons(item).join(' / ') || '未设置季节'}</span>
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Shirt />}
          title={clothing.length ? '没有符合条件的衣物' : '从第一件衣物开始'}
          body={clothing.length ? '清除部分筛选条件，再看看衣橱。' : '上传真实衣物照片并填写基本信息，数据会保存在当前设备。'}
          action={clothing.length ? <button className="button secondary" onClick={() => {setQuery(''); setCategory('全部'); setSeasons([]);}}>清除筛选</button> : <button className="button primary" onClick={beginAdd}><Plus />添加衣物</button>}
        />
      )}

      {detail && (
        <Modal title={detail.name} description="衣物详情" onClose={() => setDetail(null)}>
          <div className="item-detail">
            <div className="detail-image"><BlobImage blob={detail.image} alt={detail.name} /></div>
            <dl>
              <div><dt>分类</dt><dd>{detail.category}</dd></div>
              <div><dt>颜色</dt><dd>{detail.color || '未填写'}</dd></div>
              <div><dt>季节</dt><dd>{normalizedSeasons(detail).join('、') || '未填写'}</dd></div>
              <div><dt>风格</dt><dd>{detail.styles.join('、') || '未填写'}</dd></div>
              <div><dt>品牌</dt><dd>{detail.brand || '未填写'}</dd></div>
              <div><dt>购买价格</dt><dd>{detail.price == null ? '未填写' : `¥${detail.price}`}</dd></div>
              <div><dt>购买日期</dt><dd>{detail.purchaseDate || '未填写'}</dd></div>
              <div><dt>穿着次数</dt><dd>{detail.wearCount} 次</dd></div>
              <div><dt>最后穿着</dt><dd>{detail.lastWornDate || '尚未记录'}</dd></div>
              <div className="detail-wide"><dt>备注</dt><dd>{detail.notes || '未填写'}</dd></div>
            </dl>
          </div>
          <div className="detail-actions">
            <button className="button secondary" onClick={() => void toggleFavorite(detail)}>
              <Heart fill={detail.statuses.includes('收藏') ? 'currentColor' : 'none'} />
              {detail.statuses.includes('收藏') ? '取消收藏' : '收藏'}
            </button>
            <button className="button secondary" disabled={busy} onClick={() => void recordWear(detail)}><CalendarDays />记录穿着</button>
            <button className="button secondary" onClick={() => beginEdit(detail)}><Pencil />编辑</button>
            <button className="button danger-quiet" onClick={() => setDeleting(detail)}><Trash2 />删除</button>
          </div>
        </Modal>
      )}

      {draft && (
        <Modal title={draft.id ? '编辑衣物' : '添加衣物'} description="第一阶段采用普通图片上传与人工填写，不进行 AI 识别或去背景。" onClose={() => setDraft(null)}>
          <div className="item-form">
            <div className="upload-panel">
              {draft.image ? (
                <div className="upload-preview">
                  <BlobImage blob={draft.image} alt="衣物图片预览" />
                  <button type="button" className="icon-button" onClick={() => setDraft({...draft, image: undefined})} aria-label="取消上传"><X /></button>
                </div>
              ) : (
                <div className="upload-empty"><ImagePlus /><b>添加衣物照片 *</b><small>JPG、PNG 或 WebP，最大 20MB</small></div>
              )}
              <div className="upload-actions">
                <label className="button secondary"><ImagePlus />{draft.image ? '更换照片' : '从相册或文件选择'}<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={event => void chooseImage(event.target.files?.[0])} /></label>
                <label className="button secondary"><Camera />拍照<input hidden type="file" accept="image/*" capture="environment" onChange={event => void chooseImage(event.target.files?.[0])} /></label>
              </div>
            </div>

            <div className="form-grid">
              <label>衣物名称 *<input value={draft.name ?? ''} maxLength={60} onChange={event => setDraft({...draft, name: event.target.value})} /></label>
              <label>衣物类别 *<select value={draft.category ?? ''} onChange={event => setDraft({...draft, category: event.target.value})}><option value="">请选择</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
              <label>颜色<input value={draft.color ?? ''} list="color-options" maxLength={30} onChange={event => setDraft({...draft, color: event.target.value})} /><datalist id="color-options">{COLORS.map(value => <option key={value}>{value}</option>)}</datalist></label>
              <label>品牌<input value={draft.brand ?? ''} maxLength={60} onChange={event => setDraft({...draft, brand: event.target.value})} /></label>
              <label>购买价格<input type="number" min="0" step="0.01" value={draft.price ?? ''} onChange={event => setDraft({...draft, price: event.target.value ? Number(event.target.value) : undefined})} /></label>
              <label>购买日期<input type="date" value={draft.purchaseDate ?? ''} onChange={event => setDraft({...draft, purchaseDate: event.target.value})} /></label>
            </div>

            <fieldset>
              <legend>季节（可多选）</legend>
              <div className="choice-row">
                {SEASON_OPTIONS.map(value => <label key={value}><input type="checkbox" checked={draft.seasons?.includes(value) ?? false} onChange={event => setDraft({...draft, seasons: event.target.checked ? [...(draft.seasons ?? []), value] : draft.seasons?.filter(item => item !== value)})} />{value}</label>)}
              </div>
            </fieldset>
            <label>风格文字<input value={draft.styles?.[0] ?? ''} maxLength={60} placeholder="例如：通勤、简约" onChange={event => setDraft({...draft, styles: event.target.value ? [event.target.value] : []})} /></label>
            <label>备注<textarea value={draft.notes ?? ''} maxLength={500} onChange={event => setDraft({...draft, notes: event.target.value})} /></label>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="dialog-actions">
              <button className="button secondary" onClick={() => setDraft(null)}>取消</button>
              <button className="button primary" disabled={busy} onClick={() => void save()}>{busy ? '保存中…' : '保存衣物'}</button>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <Confirm
          title={`删除“${deleting.name}”？`}
          body="删除后无法恢复，衣橱和当前筛选结果会立即更新。"
          confirmLabel="确认删除"
          onClose={() => setDeleting(null)}
          onConfirm={() => void deleteItem()}
        />
      )}
    </>
  );
}
