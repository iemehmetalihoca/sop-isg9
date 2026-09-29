'use client';

import { Fragment, useEffect, useRef, useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronDown, ChevronUp, ClipboardPaste, Copy, Crop, GripVertical, ImagePlus, MoreHorizontal, Plus, Scissors, Trash2 } from 'lucide-react';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { InlineCheckbox, InlineImage, InlineSelect, InlineText } from '@/components/fields/InlineField';
import { DocumentHeader } from '@/components/editor/DocumentHeader';
import { LotoMetaHeader } from '@/components/editor/LotoMetaHeader';
import { blankEquipment, blankPerson, blankPoint, blankStep } from '@/lib/defaults';
import { useEditorStore } from '@/store/editor-store';
import { tr } from '@/lib/labels';
import { imageFileToDataUrl } from '@/lib/files';
import { getEnergyIconSource, getPpeIconSources } from '@/lib/default-icons';
import type { Equipment, Lang, LotoPoint, Step } from '@/lib/types';

export function SopGeneralSection() {
  const document = useEditorStore((s) => s.document);
  const mutate = useEditorStore((s) => s.mutate);
  const lang = document.uiLang;
  return <section className="a4-page"><DocumentHeader title="LOTO STANDART OPERASYON PROSEDÜRÜ" />
    <LotoMetaHeader />
    <div className="loto-types"><InlineCheckbox checked={document.lotoType.simple} onChange={(v) => mutate((d) => { d.lotoType.simple = v; })} label={tr('Basit LOTO: En fazla bir adet departman tarafından yapılan', lang)} /><InlineCheckbox checked={document.lotoType.complex} onChange={(v) => mutate((d) => { d.lotoType.complex = v; })} label={tr('Kompleks LOTO: Birden fazla departmanın dahil olduğu, LOTO SOP veya LOTO Talimatı bulunmayan', lang)} /></div>
    <CoverPhotoEditor />
    <div className="ppe-grid">{document.ppe.map((item, index) => {
      const icons = getPpeIconSources(item);
      return <label key={item.id} className={`ppe-chip ${item.checked ? 'checked' : ''}`}>
        <div className="ppe-icons">{icons.map((src, iconIndex) => <img key={`${item.id}-${iconIndex}`} className="ppe-symbol" src={src} alt="" aria-hidden="true" />)}</div>
        <div className="ppe-text"><input type="checkbox" checked={item.checked} onChange={(e) => mutate((d) => { d.ppe[index].checked = e.target.checked; })} /><span className="selection-mark">{item.checked ? '✓' : ''}</span>{tr(item.label, lang)}</div>
      </label>;
    })}</div>
    <table className="energy-table"><thead><tr><th colSpan={2}>{tr('LOTO Uygulanacak Enerji Tipi', lang)}</th><th>{tr('Diğer', lang)}</th></tr></thead><tbody><tr><td colSpan={2}><div className="energy-grid">{document.energies.map((item, index) => {
      const icon = getEnergyIconSource(item);
      return <label key={item.id} className={item.checked ? 'checked' : ''}>
        {icon ? <img className="energy-icon" src={icon} alt="" aria-hidden="true" /> : null}
        <div className="energy-label"><input type="checkbox" checked={item.checked} onChange={(e) => mutate((d) => { d.energies[index].checked = e.target.checked; })} /><span className="selection-mark">{item.checked ? '✓' : ''}</span>{tr(item.label, lang)}</div>
      </label>;
    })}</div></td><td><InlineText multiline value={document.otherEnergy} onChange={(v) => mutate((d) => { d.otherEnergy = v; })} /></td></tr></tbody></table>
    
  </section>;
}


type CoverResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
type CoverGeometry = { x: number; y: number; width: number; height: number };
type CoverClipboard = { photo: string; originalPhoto: string };
const COVER_WORKSPACE_WIDTH_MM = 115;
const COVER_WORKSPACE_HEIGHT_MM = 50;
const COVER_MIN_WIDTH_MM = 10;
const COVER_MIN_HEIGHT_MM = 8;

const clampCover = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const roundCover = (value: number) => Math.round(value * 2) / 2;
function clampCoverGeometry(geometry: CoverGeometry): CoverGeometry {
  const width = roundCover(clampCover(geometry.width, COVER_MIN_WIDTH_MM, COVER_WORKSPACE_WIDTH_MM));
  const height = roundCover(clampCover(geometry.height, COVER_MIN_HEIGHT_MM, COVER_WORKSPACE_HEIGHT_MM));
  const x = roundCover(clampCover(geometry.x, 0, Math.max(0, COVER_WORKSPACE_WIDTH_MM - width)));
  const y = roundCover(clampCover(geometry.y, 0, Math.max(0, COVER_WORKSPACE_HEIGHT_MM - height)));
  return { x, y, width, height };
}

function CoverPhotoEditor() {
  const document = useEditorStore((state) => state.document);
  const lang = document.uiLang;
  const mode = useEditorStore((state) => state.mode);
  const mutate = useEditorStore((state) => state.mutate);
  const photo = document.coverPhoto;
  const originalPhoto = document.coverPhotoOriginal;
  const inputRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clipboardPhoto, setClipboardPhoto] = useState<CoverClipboard | null>(null);
  const [cropEditing, setCropEditing] = useState(false);
  const [cropBusy, setCropBusy] = useState(false);
  const [externalFileOver, setExternalFileOver] = useState(false);
  const [interaction, setInteraction] = useState<'move' | 'resize' | null>(null);
  const [cropDraft, setCropDraft] = useState<StepCropRect>({ left: 0, top: 0, right: 100, bottom: 100 });
  const [cropImageRect, setCropImageRect] = useState<StepCropRect>({ left: 0, top: 0, right: 100, bottom: 100 });

  const committed = clampCoverGeometry({
    x: Number(document.coverPhotoXmm) || 0,
    y: Number(document.coverPhotoYmm) || 0,
    width: Number(document.coverPhotoWidthMm) || COVER_WORKSPACE_WIDTH_MM,
    height: Number(document.coverPhotoHeightMm) || COVER_WORKSPACE_HEIGHT_MM,
  });
  const [draft, setDraft] = useState<CoverGeometry>(committed);
  const draftRef = useRef<CoverGeometry>(committed);
  const sessionRef = useRef<{
    kind: 'move' | 'resize';
    handle?: CoverResizeHandle;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    start: CoverGeometry;
    pxPerMm: number;
    aspect: number;
  } | null>(null);
  const cropSessionRef = useRef<{
    handle: StepCropHandle;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    start: StepCropRect;
    mediaWidthPx: number;
    mediaHeightPx: number;
  } | null>(null);

  useEffect(() => {
    if (interaction) return;
    draftRef.current = committed;
    setDraft(committed);
  }, [committed.x, committed.y, committed.width, committed.height, interaction]);

  const commitGeometry = () => {
    const next = draftRef.current;
    setInteraction(null);
    sessionRef.current = null;
    mutate((d) => {
      d.coverPhotoXmm = next.x;
      d.coverPhotoYmm = next.y;
      d.coverPhotoWidthMm = next.width;
      d.coverPhotoHeightMm = next.height;
      d.coverPhotoScale = Math.round((next.width / COVER_WORKSPACE_WIDTH_MM) * 100);
    });
  };

  const choose = () => inputRef.current?.click();
  const replacePhoto = async (file?: File) => {
    if (!file) return;
    try {
      const src = await imageFileToDataUrl(file, lang);
      mutate((d) => {
        d.coverPhoto = src;
        d.coverPhotoOriginal = '';
      });
      setCropEditing(false);
      setMenuOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : tr('Görsel yüklenemedi.', lang));
    }
  };

  const removePhoto = () => {
    if (!photo) return;
    if (!window.confirm(tr('Kapak fotoğrafını silmek istiyor musunuz?', lang))) return;
    mutate((d) => {
      d.coverPhoto = '';
      d.coverPhotoOriginal = '';
      d.coverPhotoXmm = 0;
      d.coverPhotoYmm = 0;
      d.coverPhotoWidthMm = COVER_WORKSPACE_WIDTH_MM;
      d.coverPhotoHeightMm = COVER_WORKSPACE_HEIGHT_MM;
    });
    setCropEditing(false);
    setMenuOpen(false);
  };

  const copyPhoto = () => {
    if (!photo) return;
    setClipboardPhoto({ photo: String(photo), originalPhoto: String(originalPhoto || '') });
    setMenuOpen(false);
  };

  const pastePhoto = () => {
    if (!clipboardPhoto) return;
    if (photo && photo !== clipboardPhoto.photo && !window.confirm(tr('Mevcut kapak fotoğrafı kopyalanan fotoğrafla değiştirilsin mi?', lang))) return;
    mutate((d) => {
      d.coverPhoto = clipboardPhoto.photo;
      d.coverPhotoOriginal = clipboardPhoto.originalPhoto;
    });
    setCropEditing(false);
    setMenuOpen(false);
  };

  const startMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (mode !== 'edit' || event.button !== 0 || cropEditing) return;
    const target = event.target as HTMLElement;
    if (target.closest('button,input,.photo-action-menu')) return;
    if (!workspaceRef.current) return;
    event.preventDefault();
    const rect = workspaceRef.current.getBoundingClientRect();
    sessionRef.current = {
      kind: 'move',
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      start: draftRef.current,
      pxPerMm: Math.max(.01, rect.width / COVER_WORKSPACE_WIDTH_MM),
      aspect: draftRef.current.width / Math.max(.1, draftRef.current.height),
    };
    setInteraction('move');
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const movePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = sessionRef.current;
    if (!session || session.kind !== 'move' || session.pointerId !== event.pointerId) return;
    const dx = (event.clientX - session.startClientX) / session.pxPerMm;
    const dy = (event.clientY - session.startClientY) / session.pxPerMm;
    const next = clampCoverGeometry({ ...session.start, x: session.start.x + dx, y: session.start.y + dy });
    draftRef.current = next;
    setDraft(next);
  };

  const endMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = sessionRef.current;
    if (!session || session.kind !== 'move' || session.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    commitGeometry();
  };

  const startResize = (handle: CoverResizeHandle, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (mode !== 'edit' || cropEditing || !workspaceRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = workspaceRef.current.getBoundingClientRect();
    sessionRef.current = {
      kind: 'resize',
      handle,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      start: draftRef.current,
      pxPerMm: Math.max(.01, rect.width / COVER_WORKSPACE_WIDTH_MM),
      aspect: draftRef.current.width / Math.max(.1, draftRef.current.height),
    };
    setInteraction('resize');
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const resizePointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const session = sessionRef.current;
    if (!session || session.kind !== 'resize' || session.pointerId !== event.pointerId || !session.handle) return;
    event.preventDefault();
    const dx = (event.clientX - session.startClientX) / session.pxPerMm;
    const dy = (event.clientY - session.startClientY) / session.pxPerMm;
    const start = session.start;
    const handle = session.handle;
    let x = start.x;
    let y = start.y;
    let width = start.width;
    let height = start.height;

    // Instruction photo editor ile aynı model:
    // kenarlar yalnız ilgili ekseni, köşeler mevcut oranı koruyarak iki ekseni değiştirir.
    if (handle === 'e') {
      width = clampCover(start.width + dx, COVER_MIN_WIDTH_MM, COVER_WORKSPACE_WIDTH_MM - start.x);
    } else if (handle === 'w') {
      width = clampCover(start.width - dx, COVER_MIN_WIDTH_MM, start.x + start.width);
      x = start.x + (start.width - width);
    } else if (handle === 's') {
      height = clampCover(start.height + dy, COVER_MIN_HEIGHT_MM, COVER_WORKSPACE_HEIGHT_MM - start.y);
    } else if (handle === 'n') {
      height = clampCover(start.height - dy, COVER_MIN_HEIGHT_MM, start.y + start.height);
      y = start.y + (start.height - height);
    } else {
      const horizontal = handle.includes('e') ? dx : -dx;
      const vertical = handle.includes('s') ? dy : -dy;
      const widthScale = (start.width + horizontal) / Math.max(.1, start.width);
      const heightScale = (start.height + vertical) / Math.max(.1, start.height);
      let scale = Math.abs(widthScale - 1) >= Math.abs(heightScale - 1) ? widthScale : heightScale;
      const minScale = Math.max(COVER_MIN_WIDTH_MM / start.width, COVER_MIN_HEIGHT_MM / start.height);
      const maxWidth = handle.includes('e') ? COVER_WORKSPACE_WIDTH_MM - start.x : start.x + start.width;
      const maxHeight = handle.includes('s') ? COVER_WORKSPACE_HEIGHT_MM - start.y : start.y + start.height;
      const maxScale = Math.min(maxWidth / start.width, maxHeight / start.height);
      scale = clampCover(scale, minScale, maxScale);
      width = roundCover(start.width * scale);
      height = roundCover(start.height * scale);
      if (handle.includes('w')) x = start.x + (start.width - width);
      if (handle.includes('n')) y = start.y + (start.height - height);
    }
    const next = clampCoverGeometry({ x, y, width, height });
    draftRef.current = next;
    setDraft(next);
  };

  const endResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const session = sessionRef.current;
    if (!session || session.kind !== 'resize' || session.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    commitGeometry();
  };

  const beginCrop = async () => {
    if (!photo || !mediaRef.current) return;
    const bounds = mediaRef.current.getBoundingClientRect();
    const size = await readImageSize(photo);
    const imageRect = containRectForAspect(size.width, size.height, bounds.width || 1, bounds.height || 1);
    setCropImageRect(imageRect);
    setCropDraft(imageRect);
    setCropEditing(true);
    setMenuOpen(false);
  };

  const startCropHandle = (handle: StepCropHandle, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!mediaRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    const bounds = mediaRef.current.getBoundingClientRect();
    cropSessionRef.current = {
      handle,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      start: cropDraft,
      mediaWidthPx: Math.max(1, bounds.width),
      mediaHeightPx: Math.max(1, bounds.height),
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveCropHandle = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const session = cropSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const dx = ((event.clientX - session.startClientX) / session.mediaWidthPx) * 100;
    const dy = ((event.clientY - session.startClientY) / session.mediaHeightPx) * 100;
    const minWidth = 8;
    const minHeight = 8;
    const next = { ...session.start };
    if (session.handle.includes('w')) next.left = clampPct(session.start.left + dx, cropImageRect.left, session.start.right - minWidth);
    if (session.handle.includes('e')) next.right = clampPct(session.start.right + dx, session.start.left + minWidth, cropImageRect.right);
    if (session.handle.includes('n')) next.top = clampPct(session.start.top + dy, cropImageRect.top, session.start.bottom - minHeight);
    if (session.handle.includes('s')) next.bottom = clampPct(session.start.bottom + dy, session.start.top + minHeight, cropImageRect.bottom);
    setCropDraft(next);
  };

  const endCropHandle = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const session = cropSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    cropSessionRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const applyCrop = async () => {
    if (!photo || cropBusy) return;
    setCropBusy(true);
    try {
      const cropped = await cropStepPhotoDataUrl(photo, cropDraft, cropImageRect, lang);
      mutate((d) => {
        d.coverPhotoOriginal = d.coverPhotoOriginal || d.coverPhoto;
        d.coverPhoto = cropped;
      });
      setCropEditing(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : tr('Kapak fotoğrafı kırpılamadı.', lang));
    } finally {
      setCropBusy(false);
      cropSessionRef.current = null;
    }
  };

  const restoreOriginal = async () => {
    if (!originalPhoto || cropBusy) return;
    setCropBusy(true);
    try {
      mutate((d) => {
        if (!d.coverPhotoOriginal) return;
        d.coverPhoto = d.coverPhotoOriginal;
        d.coverPhotoOriginal = '';
      });
      setCropEditing(false);
    } finally {
      setCropBusy(false);
      cropSessionRef.current = null;
    }
  };

  const hasExternalFiles = (event: ReactDragEvent<HTMLDivElement>) => Array.from(event.dataTransfer.types || []).includes('Files');
  const allowExternalDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    if (mode !== 'edit' || cropEditing || !hasExternalFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    setExternalFileOver(true);
  };
  const leaveExternalDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    const related = event.relatedTarget as Node | null;
    if (related && event.currentTarget.contains(related)) return;
    setExternalFileOver(false);
  };
  const dropExternalPhoto = (event: ReactDragEvent<HTMLDivElement>) => {
    if (mode !== 'edit' || cropEditing) return;
    if (!hasExternalFiles(event) && event.dataTransfer.files.length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    setExternalFileOver(false);
    const file = Array.from(event.dataTransfer.files || []).find((item) => ['image/png','image/jpeg','image/webp','image/gif'].includes(item.type));
    if (!file) {
      window.alert(tr('Kapak fotoğrafına PNG, JPG, WEBP veya GIF dosyası bırakabilirsiniz.', lang));
      return;
    }
    if (photo && !window.confirm(tr('Mevcut kapak fotoğrafı bu fotoğrafla değiştirilsin mi?', lang))) return;
    void replacePhoto(file);
  };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && workspaceRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setCropEditing(false);
        cropSessionRef.current = null;
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handles: CoverResizeHandle[] = ['nw','n','ne','e','se','s','sw','w'];
  const cropStyle = cropEditing ? { objectFit: 'contain' as const } : { objectFit: 'fill' as const };

  return (
    <div
      className={`cover-photo ${photo ? 'has-photo' : 'empty-photo'}${externalFileOver ? ' cover-photo-external-drop-target' : ''}`}
      onDragOver={allowExternalDrop}
      onDragEnter={allowExternalDrop}
      onDragLeave={leaveExternalDrop}
      onDrop={dropExternalPhoto}
    >
      <div ref={workspaceRef} className="cover-photo-workspace">
        <input ref={inputRef} hidden className="no-print" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => { void replacePhoto(event.target.files?.[0]); event.currentTarget.value = ''; }} />
        {!photo && <button type="button" className="image-placeholder" onClick={choose}><ImagePlus size={18} /> {tr('Kapak Fotoğrafı', lang)}</button>}
        {photo && (
          <div
            ref={mediaRef}
            className={`cover-photo-media${interaction ? ' photo-interacting' : ''}`}
            style={{ left: `${draft.x}mm`, top: `${draft.y}mm`, width: `${draft.width}mm`, height: `${draft.height}mm` }}
            onPointerDown={startMove}
            onPointerMove={movePointer}
            onPointerUp={endMove}
            onPointerCancel={endMove}
            title={mode === 'edit' && !cropEditing ? tr('Sürükle: taşı · Kenar/köşe: boyutlandır', lang) : undefined}
          >
            <img className="cover-photo-img" src={photo} alt={tr('Kapak Fotoğrafı', lang)} draggable={false} style={cropStyle} />
            {mode === 'edit' && cropEditing && (
              <>
                <div
                  className="photo-inline-crop-selection no-print"
                  style={{ left: `${cropDraft.left}%`, top: `${cropDraft.top}%`, width: `${Math.max(0,cropDraft.right-cropDraft.left)}%`, height: `${Math.max(0,cropDraft.bottom-cropDraft.top)}%` }}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <span className="photo-inline-crop-grid" aria-hidden="true" />
                  {(['nw','n','ne','e','se','s','sw','w'] as StepCropHandle[]).map((handle) => (
                    <button key={handle} type="button" className={`photo-inline-crop-handle crop-${handle}`} aria-label={`${tr('Kırpma tutamacı', lang)} ${handle}`} onPointerDown={(event) => startCropHandle(handle,event)} onPointerMove={moveCropHandle} onPointerUp={endCropHandle} onPointerCancel={endCropHandle} />
                  ))}
                </div>
                <div className="photo-inline-crop-toolbar no-print" onPointerDown={(event) => event.stopPropagation()}>
                  {originalPhoto && <button type="button" className="secondary" disabled={cropBusy} onClick={() => { void restoreOriginal(); }}>{tr('Orijinal', lang)}</button>}
                  <button type="button" className="secondary" disabled={cropBusy} onClick={() => { setCropEditing(false); cropSessionRef.current = null; }}>{tr('İptal', lang)}</button>
                  <button type="button" className="primary" disabled={cropBusy} onClick={() => { void applyCrop(); }}>{cropBusy ? tr('Uygulanıyor…', lang) : tr('Uygula', lang)}</button>
                </div>
              </>
            )}
            {mode === 'edit' && !cropEditing && handles.map((handle) => (
              <button key={handle} type="button" className={`photo-resize-handle photo-resize-${handle} no-print`} aria-label={tr('Kapak fotoğrafını yeniden boyutlandır', lang)} onPointerDown={(event) => startResize(handle,event)} onPointerMove={resizePointer} onPointerUp={endResize} onPointerCancel={endResize} />
            ))}
            {mode === 'edit' && !cropEditing && (
              <>
                <button type="button" className="photo-menu-trigger no-print" aria-expanded={menuOpen} aria-label={tr('Fotoğraf işlemleri', lang)} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); setMenuOpen((value) => !value); }}><MoreHorizontal size={14} /></button>
                {menuOpen && (
                  <div className="photo-action-menu no-print" role="menu" onPointerDown={(event) => event.stopPropagation()}>
                    <button type="button" role="menuitem" onClick={() => { choose(); setMenuOpen(false); }}><ImagePlus size={13} /> {tr('Değiştir', lang)}</button>
                    <button type="button" role="menuitem" onClick={() => { void beginCrop(); }}><Scissors size={13} /> {tr('Kırp', lang)}</button>
                    <button type="button" role="menuitem" onClick={copyPhoto}><Copy size={13} /> {tr('Kopyala', lang)}</button>
                    <button type="button" role="menuitem" disabled={!clipboardPhoto} onClick={pastePhoto}><ClipboardPaste size={13} /> {tr('Yapıştır', lang)}</button>
                    <div className="photo-action-menu-separator" />
                    <button type="button" role="menuitem" className="danger" onClick={removePhoto}><Trash2 size={13} /> {tr('Sil', lang)}</button>
                  </div>
                )}
              </>
            )}
            {interaction && <span className="photo-resize-dimensions no-print">{draft.width.toFixed(1)} × {draft.height.toFixed(1)} mm</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function SortableSafetyRow({ item, index, count }: { item: string; index: number; count: number }) {
  const lang = useEditorStore((s) => s.document.uiLang);
  const mutate = useEditorStore((s) => s.mutate);
  const moveSafetyItem = useEditorStore((s) => s.moveSafetyItem);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `safety-row-${index}` });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 40 : undefined };

  return <div ref={setNodeRef} style={style} className={`numbered-edit ${isDragging ? 'safety-row-dragging' : ''}`}>
    <button type="button" className="safety-drag-handle no-print" title={`${index + 1}. ${tr('önlemi sürükle', lang)}`} {...attributes} {...listeners}><GripVertical size={15} /></button>
    <b className="safety-number">{index + 1}</b>
    <InlineText multiline value={tr(item, lang)} onChange={(v) => mutate((d) => { d.safety[index] = v; })} />
    <div className="safety-row-actions no-print">
      <button type="button" title={tr('Yukarı taşı', lang)} disabled={index === 0} onClick={() => moveSafetyItem(index, -1)}><ChevronUp size={13} /></button>
      <button type="button" title={tr('Aşağı taşı', lang)} disabled={index === count - 1} onClick={() => moveSafetyItem(index, 1)}><ChevronDown size={13} /></button>
      <button type="button" className="row-delete" title={tr('Önlemi sil', lang)} onClick={() => mutate((d) => { d.safety.splice(index, 1); })}><Trash2 size={13} /></button>
    </div>
  </div>;
}

export function SopSafetySection() {
  const document = useEditorStore((s) => s.document);
  const mutate = useEditorStore((s) => s.mutate);
  const lang = document.uiLang;
  const safetyIds = document.safety.map((_, index) => `safety-row-${index}`);
  return <section className="a4-page"><DocumentHeader title="LOTO STANDART OPERASYON PROSEDÜRÜ" />
    <div className="safety-box"><h2>{tr('İş Güvenliği Önlemleri', lang)}</h2><SortableContext items={safetyIds} strategy={verticalListSortingStrategy}>{document.safety.map((item, index) => <SortableSafetyRow item={item} index={index} count={document.safety.length} key={index} />)}</SortableContext><button className="inline-add no-print" onClick={() => mutate((d) => { d.safety.push(''); })}><Plus size={16} /> {tr('Önlem ekle', lang)}</button></div>
    <div className="section-title">{tr('1. LOTO Yapacak Yetkilendirilmiş Personel Birimi', lang)}</div>
    <div className="unit-line"><InlineCheckbox checked={document.units.production} onChange={(v) => mutate((d) => { d.units.production = v; })} label={tr('Üretim', lang)} /><InlineCheckbox checked={document.units.maintenance} onChange={(v) => mutate((d) => { d.units.maintenance = v; })} label={tr('Bakım', lang)} /><InlineCheckbox checked={document.units.contractor} onChange={(v) => mutate((d) => { d.units.contractor = v; })} label={tr('Müteahhit Firma', lang)} /></div>
    <AuthorizedWorkersTable />
    <table className="verifier-table">
      <tbody>
        <tr><th className="verifier-note" colSpan={6}>{tr('Doğrulayan: Bu kısım yalnızca kompleks LOTO uygulamasında doldurulacaktır.', lang)}</th></tr>
        <tr>
          <th>{tr('İsim', lang)}:</th>
          <td><InlineText multiline value={document.verifier.name} onChange={(v) => mutate((d) => { d.verifier.name = v; })} /></td>
          <th>{tr('Tarih / Saat', lang)}:</th>
          <td><div className="verifier-date-time"><InlineText multiline value={document.verifier.date} onChange={(v) => mutate((d) => { d.verifier.date = v; })} placeholder={tr('Tarih', lang)} /><span>/</span><InlineText multiline value={document.verifier.time} onChange={(v) => mutate((d) => { d.verifier.time = v; })} placeholder={tr('Saat', lang)} /></div></td>
          <th>{tr('Bölüm', lang)}:</th>
          <td><InlineText multiline value={document.verifier.department} onChange={(v) => mutate((d) => { d.verifier.department = v; })} /></td>
        </tr>
        <tr>
          <th>{tr('Telefon', lang)}:</th>
          <td><InlineText multiline value={document.verifier.phone} onChange={(v) => mutate((d) => { d.verifier.phone = v; })} /></td>
          <th>{tr('Görev', lang)}:</th>
          <td><InlineText multiline value={document.verifier.duty} onChange={(v) => mutate((d) => { d.verifier.duty = v; })} /></td>
          <th>{tr('İmza', lang)}:</th>
          <td><InlineText multiline value={document.verifier.signature} onChange={(v) => mutate((d) => { d.verifier.signature = v; })} /></td>
        </tr>
      </tbody>
    </table>
    
  </section>;
}

function personHasContent(person: ReturnType<typeof blankPerson>) {
  return [person.name, person.phone, person.department, person.duty, person.date, person.time, person.signature]
    .some((value) => String(value || '').trim().length > 0);
}

function AuthorizedWorkersTable() {
  const people = useEditorStore((s) => s.document.workers);
  const lang = useEditorStore((s) => s.document.uiLang);
  const mutate = useEditorStore((s) => s.mutate);

  const removePerson = (index: number) => {
    const person = people[index];
    if (personHasContent(person) && !window.confirm(tr('Bu kişiyi silmek istiyor musunuz?', lang))) return;
    mutate((d) => {
      d.workers.splice(index, 1);
      if (!d.workers.length) d.workers.push(blankPerson());
    });
  };

  return <div className="editable-table-wrap authorized-workers-wrap">
    <table className="people-table authorized-workers-table">
      <thead><tr><th colSpan={6}>{tr('Yetkili Çalışanlar', lang)}</th></tr></thead>
      <tbody>
        {people.map((person, index) => <Fragment key={index}>
          <tr className={`authorized-worker-row ${index > 0 ? 'authorized-worker-row-start' : ''}`}>
            <th>{tr('İsim', lang)}:</th>
            <td><InlineText multiline value={person.name} onChange={(v) => mutate((d) => { d.workers[index].name = v; })} /></td>
            <th>{tr('Tarih', lang)}:</th>
            <td><InlineText multiline value={person.date || person.duty} onChange={(v) => mutate((d) => { if (!d.workers[index].date && d.workers[index].duty) d.workers[index].duty = ''; d.workers[index].date = v; })} /></td>
            <th>{tr('Bölüm', lang)}:</th>
            <td><InlineText multiline value={person.department} onChange={(v) => mutate((d) => { d.workers[index].department = v; })} /></td>
          </tr>
          <tr className="authorized-worker-row">
            <th>{tr('Telefon', lang)}:</th>
            <td><InlineText multiline value={person.phone} onChange={(v) => mutate((d) => { d.workers[index].phone = v; })} /></td>
            <th>{tr('Saat', lang)}:</th>
            <td><InlineText multiline value={person.time} onChange={(v) => mutate((d) => { d.workers[index].time = v; })} /></td>
            <th>{tr('İmza', lang)}:</th>
            <td className="person-signature-cell"><InlineText multiline value={person.signature} onChange={(v) => mutate((d) => { d.workers[index].signature = v; })} /><button type="button" className="person-delete-outside no-print" title={tr('Kişiyi sil', lang)} aria-label={`${index + 1}. ${tr('Kişiyi sil', lang)}`} onClick={() => removePerson(index)}><Trash2 size={15} strokeWidth={1.8} /></button></td>
          </tr>
        </Fragment>)}
      </tbody>
    </table>
    <button className="inline-add no-print" onClick={() => mutate((d) => { d.workers.push(blankPerson()); })}><Plus size={16} /> {tr('Kişi ekle', lang)}</button>
  </div>;
}

function PersonTable({ title, peopleKey }: { title: string; peopleKey: 'workers' | 'personnel' | 'commissioning' }) {
  const people = useEditorStore((s) => s.document[peopleKey]);
  const lang = useEditorStore((s) => s.document.uiLang);
  const mutate = useEditorStore((s) => s.mutate);

  const removePerson = (index: number) => {
    const person = people[index];
    if (personHasContent(person) && !window.confirm(tr('Bu kişiyi silmek istiyor musunuz?', lang))) return;
    mutate((d) => {
      d[peopleKey].splice(index, 1);
      if (!d[peopleKey].length) d[peopleKey].push(blankPerson());
    });
  };

  return <div className="editable-table-wrap"><table className="people-table"><thead><tr><th colSpan={6}>{tr(title, lang)}</th></tr><tr><th>{tr('No', lang)}</th><th>{tr('İsim', lang)}</th><th>{tr('Telefon', lang)}</th><th>{tr('Bölüm / Şirket', lang)}</th><th>{tr('Görev', lang)} / {tr('Tarih', lang)}</th><th>{tr('İmza', lang)}</th></tr></thead><tbody>{people.map((person, index) => <tr className="person-row" key={index}><td>{index + 1}</td><td><InlineText multiline value={person.name} onChange={(v) => mutate((d) => { d[peopleKey][index].name = v; })} /></td><td><InlineText multiline value={person.phone} onChange={(v) => mutate((d) => { d[peopleKey][index].phone = v; })} /></td><td><InlineText multiline value={person.department} onChange={(v) => mutate((d) => { d[peopleKey][index].department = v; })} /></td><td><InlineText multiline value={person.duty || person.date} onChange={(v) => mutate((d) => { d[peopleKey][index].duty = v; })} /></td><td className="person-signature-cell"><InlineText multiline value={person.signature} onChange={(v) => mutate((d) => { d[peopleKey][index].signature = v; })} /><button type="button" className="person-delete-outside no-print" title={tr('Kişiyi sil', lang)} aria-label={`${index + 1}. ${tr('Kişiyi sil', lang)}`} onClick={() => removePerson(index)}><Trash2 size={15} strokeWidth={1.8} /></button></td></tr>)}</tbody></table><button className="inline-add no-print" onClick={() => mutate((d) => { d[peopleKey].push(blankPerson()); })}><Plus size={16} /> {tr('Kişi ekle', lang)}</button></div>;
}

type SortableBindings = ReturnType<typeof useSortable>;

function TableRowOrderCell({ index, title, attributes, listeners }: { index: number; title: string; attributes: SortableBindings['attributes']; listeners: SortableBindings['listeners'] }) {
  return <td className="table-row-order-cell"><div className="table-row-order-content"><button type="button" className="table-row-drag-handle no-print" title={title} aria-label={title} {...attributes} {...listeners}><GripVertical size={13} strokeWidth={1.8} /></button><span>{index + 1}</span></div></td>;
}

function EquipmentPhotoCell({ row, index, clipboardPhoto, setClipboardPhoto, draggingPhotoIndex, setDraggingPhotoIndex, dropTargetIndex, setDropTargetIndex, openMenuIndex, setOpenMenuIndex, onDeleteRow }: {
  row: Equipment;
  index: number;
  clipboardPhoto: PhotoClipboard | null;
  setClipboardPhoto: (value: PhotoClipboard | null) => void;
  draggingPhotoIndex: number | null;
  setDraggingPhotoIndex: (index: number | null) => void;
  dropTargetIndex: number | null;
  setDropTargetIndex: (index: number | null) => void;
  openMenuIndex: number | null;
  setOpenMenuIndex: (index: number | null) => void;
  onDeleteRow: () => void;
}) {
  const lang = useEditorStore((s) => s.document.uiLang);
  const mutate = useEditorStore((s) => s.mutate);
  const mode = useEditorStore((s) => s.mode);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuOpen = openMenuIndex === index;
  const [externalFileOver, setExternalFileOver] = useState(false);
  const mediaRef = useRef<HTMLDivElement>(null);
  const [cropEditing, setCropEditing] = useState(false);
  const [cropBusy, setCropBusy] = useState(false);
  const [cropDraft, setCropDraft] = useState<StepCropRect>({ left: 0, top: 0, right: 100, bottom: 100 });
  const [cropImageRect, setCropImageRect] = useState<StepCropRect>({ left: 0, top: 0, right: 100, bottom: 100 });
  const cropSessionRef = useRef<{
    handle: StepCropHandle;
    startClientX: number;
    startClientY: number;
    start: StepCropRect;
    mediaWidthPx: number;
    mediaHeightPx: number;
  } | null>(null);

  const replacePhoto = async (file?: File) => {
    if (!file) return;
    try {
      const src = await imageFileToDataUrl(file, lang);
      mutate((d) => {
        const target = d.equipments[index];
        if (!target) return;
        target.photo = src;
        target.originalPhoto = '';
      });
      setCropEditing(false);
      setOpenMenuIndex(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : tr('Görsel yüklenemedi.', lang));
    }
  };

  const openReplacePicker = () => {
    const input = fileInputRef.current;
    if (!input) return;
    input.value = '';
    input.click();
    setOpenMenuIndex(null);
  };

  const removePhoto = () => {
    if (!row.photo) { setOpenMenuIndex(null); return; }
    mutate((d) => {
      const target = d.equipments[index];
      if (!target) return;
      target.photo = '';
      target.originalPhoto = '';
    });
    setCropEditing(false);
    setOpenMenuIndex(null);
  };

  const copyPhoto = () => {
    if (!row.photo) { setOpenMenuIndex(null); return; }
    setClipboardPhoto({ photo: String(row.photo), originalPhoto: String(row.originalPhoto || '') });
    setOpenMenuIndex(null);
  };

  const pastePhoto = () => {
    if (!clipboardPhoto) { setOpenMenuIndex(null); return; }
    if (row.photo && row.photo !== clipboardPhoto.photo && !window.confirm(tr('Bu ekipmandaki mevcut fotoğraf kopyalanan fotoğrafla değiştirilsin mi?', lang))) {
      setOpenMenuIndex(null);
      return;
    }
    mutate((d) => {
      const target = d.equipments[index];
      if (!target) return;
      target.photo = String(clipboardPhoto.photo);
      target.originalPhoto = String(clipboardPhoto.originalPhoto || '');
    });
    setCropEditing(false);
    setOpenMenuIndex(null);
  };

  const beginCrop = async () => {
    if (!row.photo || !mediaRef.current) { setOpenMenuIndex(null); return; }
    try {
      const bounds = mediaRef.current.getBoundingClientRect();
      const size = await readImageSize(row.photo);
      const imageRect = containRectForAspect(size.width, size.height, bounds.width || 1, bounds.height || 1);
      setCropImageRect(imageRect);
      setCropDraft(imageRect);
      setCropEditing(true);
      setOpenMenuIndex(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : tr('Fotoğraf kırpma modu başlatılamadı.', lang));
    }
  };

  const cancelCrop = () => {
    setCropBusy(false);
    setCropEditing(false);
    setOpenMenuIndex(null);
    cropSessionRef.current = null;
  };

  const applyCrop = async () => {
    if (!row.photo) { cancelCrop(); return; }
    try {
      setCropBusy(true);
      const cropped = await cropStepPhotoDataUrl(row.photo, cropDraft, cropImageRect, lang);
      mutate((d) => {
        const target = d.equipments[index];
        if (!target) return;
        target.originalPhoto = target.originalPhoto || target.photo;
        target.photo = cropped;
      });
      setCropEditing(false);
      setOpenMenuIndex(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : tr('Fotoğraf kırpılamadı.', lang));
    } finally {
      setCropBusy(false);
      cropSessionRef.current = null;
    }
  };

  const restoreOriginalPhoto = () => {
    if (!row.originalPhoto || cropBusy) return;
    mutate((d) => {
      const target = d.equipments[index];
      if (!target || !target.originalPhoto) return;
      target.photo = target.originalPhoto;
      target.originalPhoto = '';
    });
    setCropEditing(false);
    setCropBusy(false);
    cropSessionRef.current = null;
    setOpenMenuIndex(null);
  };

  const startCropResize = (event: ReactPointerEvent<HTMLButtonElement>, handle: StepCropHandle) => {
    if (!mediaRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    const bounds = mediaRef.current.getBoundingClientRect();
    cropSessionRef.current = {
      handle,
      startClientX: event.clientX,
      startClientY: event.clientY,
      start: cropDraft,
      mediaWidthPx: Math.max(1, bounds.width),
      mediaHeightPx: Math.max(1, bounds.height),
    };
  };

  const startPhotoDrag = (event: ReactDragEvent<HTMLDivElement>) => {
    if (mode !== 'edit' || !row.photo || cropEditing) { event.preventDefault(); return; }
    const target = event.target as HTMLElement | null;
    if (target?.closest('button,input')) { event.preventDefault(); return; }
    setOpenMenuIndex(null);
    setDraggingPhotoIndex(index);
    setDropTargetIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-loto-equipment-photo', String(index));
    event.dataTransfer.setData('text/plain', String(index));
  };

  const hasExternalFiles = (event: ReactDragEvent<HTMLTableCellElement>) =>
    Array.from(event.dataTransfer.types || []).includes('Files');

  const allowPhotoDrop = (event: ReactDragEvent<HTMLTableCellElement>) => {
    if (mode !== 'edit' || cropEditing) return;
    if (hasExternalFiles(event)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      setExternalFileOver(true);
      return;
    }
    const hasEquipmentPhoto = Array.from(event.dataTransfer.types || []).includes('application/x-loto-equipment-photo');
    if (draggingPhotoIndex === null && !hasEquipmentPhoto) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTargetIndex(index);
  };

  const dropPhoto = (event: ReactDragEvent<HTMLTableCellElement>) => {
    if (mode !== 'edit' || cropEditing) return;
    event.preventDefault();

    if (hasExternalFiles(event) || event.dataTransfer.files.length > 0) {
      event.stopPropagation();
      setExternalFileOver(false);
      setDraggingPhotoIndex(null);
      setDropTargetIndex(null);
      const files = Array.from(event.dataTransfer.files || []);
      const file = files.find((item) => ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(item.type));
      if (!file) {
        window.alert(tr('Bu alana PNG, JPG, WEBP veya GIF fotoğraf bırakabilirsiniz.', lang));
        return;
      }
      if (row.photo && !window.confirm(tr('Bu ekipmandaki mevcut fotoğraf değiştirilsin mi?', lang))) return;
      void replacePhoto(file);
      return;
    }

    const raw = event.dataTransfer.getData('application/x-loto-equipment-photo') || event.dataTransfer.getData('text/plain');
    const from = Number(raw);
    setDraggingPhotoIndex(null);
    setDropTargetIndex(null);
    if (!Number.isInteger(from) || from < 0 || from === index) return;
    mutate((d) => {
      if (from >= d.equipments.length || index >= d.equipments.length) return;
      const sourcePhoto = d.equipments[from].photo;
      if (!sourcePhoto) return;
      const sourceOriginalPhoto = d.equipments[from].originalPhoto;
      const targetPhoto = d.equipments[index].photo;
      const targetOriginalPhoto = d.equipments[index].originalPhoto;
      d.equipments[index].photo = sourcePhoto;
      d.equipments[index].originalPhoto = sourceOriginalPhoto;
      d.equipments[from].photo = targetPhoto;
      d.equipments[from].originalPhoto = targetOriginalPhoto;
    });
  };

  const dragEnded = () => {
    setDraggingPhotoIndex(null);
    setDropTargetIndex(null);
    setExternalFileOver(false);
  };

  useEffect(() => {
    if (!cropEditing) return;
    const handleMove = (event: PointerEvent) => {
      const session = cropSessionRef.current;
      if (!session) return;
      const dxPct = ((event.clientX - session.startClientX) / session.mediaWidthPx) * 100;
      const dyPct = ((event.clientY - session.startClientY) / session.mediaHeightPx) * 100;
      const next = { ...session.start };
      if (session.handle.includes('w')) next.left = clampPct(session.start.left + dxPct, cropImageRect.left, session.start.right - STEP_CROP_MIN_PCT);
      if (session.handle.includes('e')) next.right = clampPct(session.start.right + dxPct, session.start.left + STEP_CROP_MIN_PCT, cropImageRect.right);
      if (session.handle.includes('n')) next.top = clampPct(session.start.top + dyPct, cropImageRect.top, session.start.bottom - STEP_CROP_MIN_PCT);
      if (session.handle.includes('s')) next.bottom = clampPct(session.start.bottom + dyPct, session.start.top + STEP_CROP_MIN_PCT, cropImageRect.bottom);
      setCropDraft(next);
    };
    const handleUp = () => { cropSessionRef.current = null; };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [cropEditing, cropImageRect]);

  const isDropTarget = mode === 'edit' && draggingPhotoIndex !== null && draggingPhotoIndex !== index && dropTargetIndex === index;
  const isDraggingThis = draggingPhotoIndex === index;

  return (
    <td
      className={`equipment-photo-cell equipment-action-anchor${isDropTarget ? ' equipment-photo-drop-target' : ''}${externalFileOver ? ' equipment-photo-external-drop-target' : ''}${isDraggingThis ? ' equipment-photo-drag-source' : ''}`}
      onDragOver={allowPhotoDrop}
      onDragEnter={allowPhotoDrop}
      onDragLeave={(event) => {
        const related = event.relatedTarget as Node | null;
        if (related && event.currentTarget.contains(related)) return;
        if (externalFileOver) setExternalFileOver(false);
        if (dropTargetIndex === index) setDropTargetIndex(null);
      }}
      onDrop={dropPhoto}
    >
      <div
        className={`equipment-photo-editor${row.photo ? ' has-photo' : ' empty-photo'}${cropEditing ? ' crop-active' : ''}`}
        draggable={mode === 'edit' && Boolean(row.photo) && !cropEditing}
        onDragStart={startPhotoDrag}
        onDragEnd={dragEnded}
        title={mode === 'edit' && row.photo && !cropEditing ? tr('Fotoğrafı tutup başka bir ekipman satırının fotoğraf alanına sürükleyin', lang) : undefined}
      >
        <input
          ref={fileInputRef}
          className="no-print"
          hidden
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => { void replacePhoto(event.target.files?.[0]); event.currentTarget.value = ''; }}
        />
        <div ref={mediaRef} className="equipment-photo-media">
          <InlineImage
            src={row.photo}
            showActions={false}
            onChange={(src) => mutate((d) => { d.equipments[index].photo = src; d.equipments[index].originalPhoto = ''; })}
            placeholder="Fotoğraf ekle"
          />
          {mode === 'edit' && cropEditing && row.photo && (
            <div className="step-photo-crop-overlay no-print" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
              <div
                className="step-photo-crop-selection"
                style={{
                  left: `${cropDraft.left}%`,
                  top: `${cropDraft.top}%`,
                  width: `${Math.max(0, cropDraft.right - cropDraft.left)}%`,
                  height: `${Math.max(0, cropDraft.bottom - cropDraft.top)}%`,
                }}
              >
                {(['nw','n','ne','e','se','s','sw','w'] as StepCropHandle[]).map((handle) => (
                  <button
                    key={handle}
                    type="button"
                    className={`step-photo-crop-handle handle-${handle}`}
                    aria-label={`${tr('Kırpma tutamacı', lang)} ${handle}`}
                    onPointerDown={(event) => startCropResize(event, handle)}
                  />
                ))}
              </div>
              <div className="step-photo-crop-actions">
                {row.originalPhoto && (
                  <button type="button" className="secondary" onClick={(event) => { event.preventDefault(); event.stopPropagation(); restoreOriginalPhoto(); }} disabled={cropBusy}>{tr('Orijinal', lang)}</button>
                )}
                <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); cancelCrop(); }} disabled={cropBusy}>{tr('İptal', lang)}</button>
                <button type="button" className="primary" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void applyCrop(); }} disabled={cropBusy}>{cropBusy ? tr('Uygulanıyor...', lang) : tr('Uygula', lang)}</button>
              </div>
            </div>
          )}
        </div>
        {mode === 'edit' && !cropEditing && (row.photo || clipboardPhoto) && (
          <div
            className="equipment-photo-menu-wrap no-print"
            data-equipment-photo-menu-root="true"
            draggable={false}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onDragStart={(event) => { event.preventDefault(); event.stopPropagation(); }}
          >
            <button
              type="button"
              className="equipment-photo-menu-trigger"
              aria-label={`${index + 1}. ${tr('ekipman fotoğraf işlemleri', lang)}`}
              title={tr('Fotoğraf işlemleri', lang)}
              aria-expanded={menuOpen}
              onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpenMenuIndex(menuOpen ? null : index); }}
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <div className="equipment-photo-action-menu" role="menu" aria-label={`${index + 1}. ${tr('ekipman fotoğraf menüsü', lang)}`}>
                <button type="button" role="menuitem" disabled={!row.photo} onClick={(event) => { event.preventDefault(); event.stopPropagation(); openReplacePicker(); }}><ImagePlus size={13} /> {tr('Değiştir', lang)}</button>
                <button type="button" role="menuitem" disabled={!row.photo} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void beginCrop(); }}><Crop size={13} /> {tr('Kırp', lang)}</button>
                <button type="button" role="menuitem" disabled={!row.photo} onClick={(event) => { event.preventDefault(); event.stopPropagation(); copyPhoto(); }}><Copy size={13} /> {tr('Kopyala', lang)}</button>
                <button type="button" role="menuitem" disabled={!clipboardPhoto} onClick={(event) => { event.preventDefault(); event.stopPropagation(); pastePhoto(); }}><ClipboardPaste size={13} /> {tr('Yapıştır', lang)}</button>
                <button type="button" role="menuitem" className="danger" disabled={!row.photo} onClick={(event) => { event.preventDefault(); event.stopPropagation(); removePhoto(); }}><Trash2 size={13} /> {tr('Sil', lang)}</button>
              </div>
            )}
          </div>
        )}
      </div>
      <button type="button" className="table-row-delete-outside no-print" title={tr('Ekipmanı sil', lang)} aria-label={`${index + 1}. ${tr('Ekipmanı sil', lang)}`} onClick={onDeleteRow}><Trash2 size={15} strokeWidth={1.8} /></button>
    </td>
  );
}

function SortableEquipmentRow({ row, index, clipboardPhoto, setClipboardPhoto, draggingPhotoIndex, setDraggingPhotoIndex, dropTargetIndex, setDropTargetIndex, openMenuIndex, setOpenMenuIndex }: {
  row: Equipment;
  index: number;
  clipboardPhoto: PhotoClipboard | null;
  setClipboardPhoto: (value: PhotoClipboard | null) => void;
  draggingPhotoIndex: number | null;
  setDraggingPhotoIndex: (index: number | null) => void;
  dropTargetIndex: number | null;
  setDropTargetIndex: (index: number | null) => void;
  openMenuIndex: number | null;
  setOpenMenuIndex: (index: number | null) => void;
}) {
  const lang = useEditorStore((s) => s.document.uiLang);
  const mutate = useEditorStore((s) => s.mutate);
  const mode = useEditorStore((s) => s.mode);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `equipment-row-${index}`, disabled: mode !== 'edit' });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 35 : undefined, position: 'relative' as const };
  return <tr ref={setNodeRef} style={style} className={`equipment-row sortable-table-row ${isDragging ? 'table-row-dragging' : ''}`}>
    <TableRowOrderCell index={index} title={`${index + 1}. ${tr('ekipmanı sürükle', lang)}`} attributes={attributes} listeners={listeners} />
    <td><InlineText multiline value={row.equipmentNo} onChange={(v) => mutate((d) => { d.equipments[index].equipmentNo = v; })} /></td>
    <td><InlineText multiline value={tr(row.name, lang)} onChange={(v) => mutate((d) => { d.equipments[index].name = v; })} /></td>
    <td><InlineText multiline value={row.qty} onChange={(v) => mutate((d) => { d.equipments[index].qty = v; })} /></td>
    <EquipmentPhotoCell
      row={row}
      index={index}
      clipboardPhoto={clipboardPhoto}
      setClipboardPhoto={setClipboardPhoto}
      draggingPhotoIndex={draggingPhotoIndex}
      setDraggingPhotoIndex={setDraggingPhotoIndex}
      dropTargetIndex={dropTargetIndex}
      setDropTargetIndex={setDropTargetIndex}
      openMenuIndex={openMenuIndex}
      setOpenMenuIndex={setOpenMenuIndex}
      onDeleteRow={() => { setOpenMenuIndex(null); mutate((d) => { d.equipments.splice(index, 1); d.equipments.forEach((x, i) => { x.no = i + 1; }); }); }}
    />
  </tr>;
}

export function SopEquipmentSection() {
  const rows = useEditorStore((s) => s.document.equipments);
  const lang = useEditorStore((s) => s.document.uiLang);
  const mutate = useEditorStore((s) => s.mutate);
  const [clipboardPhoto, setClipboardPhoto] = useState<PhotoClipboard | null>(null);
  const [draggingPhotoIndex, setDraggingPhotoIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [openPhotoMenuIndex, setOpenPhotoMenuIndex] = useState<number | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest('[data-equipment-photo-menu-root="true"]')) return;
      setOpenPhotoMenuIndex(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenPhotoMenuIndex(null);
    };
    window.document.addEventListener('pointerdown', handlePointerDown);
    window.document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.document.removeEventListener('pointerdown', handlePointerDown);
      window.document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const rowIds = rows.map((_, index) => `equipment-row-${index}`);
  return <section className="a4-page"><DocumentHeader title="LOTO STANDART OPERASYON PROSEDÜRÜ" /><table className="equipment-table"><thead><tr><th className="left" colSpan={5}>{tr('2. Kullanılacak LOTO Ekipmanları', lang)}</th></tr><tr><th>{tr('No', lang)}</th><th>{tr('Ekipman Numarası', lang)}</th><th>{tr('Ekipman İsmi', lang)}</th><th>{tr('Kullanılan Adet', lang)}</th><th>{tr('Ekipman Fotoğrafı', lang)}</th></tr></thead><SortableContext items={rowIds} strategy={verticalListSortingStrategy}><tbody>{rows.map((row, index) => <SortableEquipmentRow
    row={row}
    index={index}
    key={`equipment-${index}`}
    clipboardPhoto={clipboardPhoto}
    setClipboardPhoto={setClipboardPhoto}
    draggingPhotoIndex={draggingPhotoIndex}
    setDraggingPhotoIndex={setDraggingPhotoIndex}
    dropTargetIndex={dropTargetIndex}
    setDropTargetIndex={setDropTargetIndex}
    openMenuIndex={openPhotoMenuIndex}
    setOpenMenuIndex={setOpenPhotoMenuIndex}
  />)}</tbody></SortableContext></table><button className="inline-add no-print" onClick={() => mutate((d) => { d.equipments.push(blankEquipment(d.equipments.length + 1)); })}><Plus size={16} /> {tr('Ekipman ekle', lang)}</button></section>;
}

function SortablePointRow({ point, index }: { point: LotoPoint; index: number }) {
  const lang = useEditorStore((s) => s.document.uiLang);
  const mutate = useEditorStore((s) => s.mutate);
  const mode = useEditorStore((s) => s.mode);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `point-row-${index}`, disabled: mode !== 'edit' });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 35 : undefined, position: 'relative' as const };
  return <tr ref={setNodeRef} style={style} className={`point-row sortable-table-row ${isDragging ? 'table-row-dragging' : ''}`}>
    <TableRowOrderCell index={index} title={`${index + 1}. ${tr('LOTO noktasını sürükle', lang)}`} attributes={attributes} listeners={listeners} />
    <td><InlineText multiline value={point.pointNo} onChange={(v) => mutate((d) => { d.points[index].pointNo = v; })} /></td>
    <td><InlineText multiline value={tr(point.equipmentType, lang)} onChange={(v) => mutate((d) => { d.points[index].equipmentType = v; })} /></td>
    <td><InlineText multiline value={tr(point.lockType, lang)} onChange={(v) => mutate((d) => { d.points[index].lockType = v; })} /></td>
    <td><InlineSelect value={point.action} onChange={(v) => mutate((d) => { d.points[index].action = v as 'Kapatıldı' | 'Açıldı'; })} options={[{ value: 'Kapatıldı', label: tr('Kapatıldı', lang) }, { value: 'Açıldı', label: tr('Açıldı', lang) }]} /></td>
    <td className="points-action-anchor"><InlineText multiline value={point.authorizedPerson} onChange={(v) => mutate((d) => { d.points[index].authorizedPerson = v; })} /><button type="button" className="table-row-delete-outside no-print" title={tr('LOTO noktasını sil', lang)} aria-label={`${index + 1}. ${tr('LOTO noktasını sil', lang)}`} onClick={() => mutate((d) => { d.points.splice(index, 1); d.points.forEach((x, i) => { x.no = i + 1; }); })}><Trash2 size={15} strokeWidth={1.8} /></button></td>
  </tr>;
}

export function SopPersonnelPointsSection() {
  const document = useEditorStore((s) => s.document);
  const lang = document.uiLang;
  const mutate = useEditorStore((s) => s.mutate);
  const pointIds = document.points.map((_, index) => `point-row-${index}`);
  return <section className="a4-page"><DocumentHeader title="LOTO STANDART OPERASYON PROSEDÜRÜ" /><PersonTable title="3. Çalışacak Personel Listesi" peopleKey="personnel" />
    <table className="points-table"><thead><tr><th className="left" colSpan={6}>{tr('4. LOTO Noktaları', lang)}</th></tr><tr><th>{tr('No', lang)}</th><th>{tr('Kilitleme Noktası', lang)}</th><th>{tr('LOTO Uygulanacak Ekipman Tipi', lang)}</th><th>{tr('Kullanılan LOTO Ekipman Tipi', lang)}</th><th>{tr('Yapılan İşlem', lang)}</th><th>{tr('Yetkili Personel', lang)}</th></tr></thead><SortableContext items={pointIds} strategy={verticalListSortingStrategy}><tbody>{document.points.map((point, index) => <SortablePointRow point={point} index={index} key={`point-${index}`} />)}</tbody></SortableContext></table><button className="inline-add no-print" onClick={() => mutate((d) => { d.points.push(blankPoint(d.points.length + 1)); })}><Plus size={16} /> {tr('LOTO noktası ekle', lang)}</button></section>;
}


type StepCropRect = { left: number; top: number; right: number; bottom: number };
type StepCropHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
type PhotoClipboard = { photo: string; originalPhoto: string };

const STEP_CROP_MIN_PCT = 8;

function clampPct(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function containRectForAspect(naturalWidth: number, naturalHeight: number, frameWidth: number, frameHeight: number): StepCropRect {
  const naturalAspect = Math.max(0.0001, naturalWidth / Math.max(1, naturalHeight));
  const frameAspect = Math.max(0.0001, frameWidth / Math.max(1, frameHeight));
  if (naturalAspect >= frameAspect) {
    const visibleHeightPct = clampPct((frameAspect / naturalAspect) * 100, 0, 100);
    const top = (100 - visibleHeightPct) / 2;
    return { left: 0, top, right: 100, bottom: top + visibleHeightPct };
  }
  const visibleWidthPct = clampPct((naturalAspect / frameAspect) * 100, 0, 100);
  const left = (100 - visibleWidthPct) / 2;
  return { left, top: 0, right: left + visibleWidthPct, bottom: 100 };
}

async function readImageSize(src: string) {
  const image = new Image();
  image.src = src;
  await image.decode().catch(() => undefined);
  return {
    width: image.naturalWidth || 1,
    height: image.naturalHeight || 1,
  };
}

async function cropStepPhotoDataUrl(src: string, cropRect: StepCropRect, imageRect: StepCropRect, lang: Lang) {
  const image = new Image();
  image.src = src;
  await image.decode().catch(() => undefined);
  const naturalWidth = image.naturalWidth || 1;
  const naturalHeight = image.naturalHeight || 1;
  const imageWidthPct = Math.max(0.0001, imageRect.right - imageRect.left);
  const imageHeightPct = Math.max(0.0001, imageRect.bottom - imageRect.top);

  const x1 = clampPct((cropRect.left - imageRect.left) / imageWidthPct, 0, 1);
  const y1 = clampPct((cropRect.top - imageRect.top) / imageHeightPct, 0, 1);
  const x2 = clampPct((cropRect.right - imageRect.left) / imageWidthPct, 0, 1);
  const y2 = clampPct((cropRect.bottom - imageRect.top) / imageHeightPct, 0, 1);

  const sx = Math.max(0, Math.floor(x1 * naturalWidth));
  const sy = Math.max(0, Math.floor(y1 * naturalHeight));
  const sw = Math.max(1, Math.min(naturalWidth - sx, Math.ceil((x2 - x1) * naturalWidth)));
  const sh = Math.max(1, Math.min(naturalHeight - sy, Math.ceil((y2 - y1) * naturalHeight)));

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const context = canvas.getContext('2d');
  if (!context) throw new Error(tr('Kırpma için canvas oluşturulamadı.', lang));
  context.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas.toDataURL('image/png');
}

function StepPhotoCell({ step, index, clipboardPhoto, setClipboardPhoto, draggingPhotoIndex, setDraggingPhotoIndex, dropTargetIndex, setDropTargetIndex, openMenuIndex, setOpenMenuIndex }: {
  step: Step;
  index: number;
  clipboardPhoto: PhotoClipboard | null;
  setClipboardPhoto: (value: PhotoClipboard | null) => void;
  draggingPhotoIndex: number | null;
  setDraggingPhotoIndex: (index: number | null) => void;
  dropTargetIndex: number | null;
  setDropTargetIndex: (index: number | null) => void;
  openMenuIndex: number | null;
  setOpenMenuIndex: (index: number | null) => void;
}) {
  const lang = useEditorStore((s) => s.document.uiLang);
  const mutate = useEditorStore((s) => s.mutate);
  const mode = useEditorStore((s) => s.mode);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuOpen = openMenuIndex === index;
  const [externalFileOver, setExternalFileOver] = useState(false);
  const mediaRef = useRef<HTMLDivElement>(null);
  const [cropEditing, setCropEditing] = useState(false);
  const [cropBusy, setCropBusy] = useState(false);
  const [cropDraft, setCropDraft] = useState<StepCropRect>({ left: 0, top: 0, right: 100, bottom: 100 });
  const [cropImageRect, setCropImageRect] = useState<StepCropRect>({ left: 0, top: 0, right: 100, bottom: 100 });
  const cropSessionRef = useRef<{
    handle: StepCropHandle;
    startClientX: number;
    startClientY: number;
    start: StepCropRect;
    mediaWidthPx: number;
    mediaHeightPx: number;
  } | null>(null);

  const replacePhoto = async (file?: File) => {
    if (!file) return;
    try {
      const src = await imageFileToDataUrl(file, lang);
      mutate((d) => { d.steps[index].photo = src; d.steps[index].originalPhoto = ''; });
      setCropEditing(false);
      setOpenMenuIndex(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : tr('Görsel yüklenemedi.', lang));
    }
  };

  const openReplacePicker = () => {
    // Keep the native file picker call inside the user's click gesture. Closing the
    // menu BEFORE input.click() can make some browsers treat the picker as detached.
    const input = fileInputRef.current;
    if (!input) return;
    input.value = '';
    input.click();
    setOpenMenuIndex(null);
  };

  const removePhoto = () => {
    if (!step.photo) { setOpenMenuIndex(null); return; }
    mutate((d) => { d.steps[index].photo = ''; d.steps[index].originalPhoto = ''; });
    setCropEditing(false);
    setOpenMenuIndex(null);
  };

  const copyPhoto = () => {
    if (!step.photo) { setOpenMenuIndex(null); return; }
    setClipboardPhoto({ photo: String(step.photo), originalPhoto: String(step.originalPhoto || '') });
    setOpenMenuIndex(null);
  };

  const pastePhoto = () => {
    if (!clipboardPhoto) { setOpenMenuIndex(null); return; }
    if (step.photo && step.photo !== clipboardPhoto.photo && !window.confirm(tr('Bu satırdaki mevcut fotoğraf kopyalanan fotoğrafla değiştirilsin mi?', lang))) {
      setOpenMenuIndex(null);
      return;
    }
    mutate((d) => { d.steps[index].photo = String(clipboardPhoto.photo); d.steps[index].originalPhoto = String(clipboardPhoto.originalPhoto || ''); });
    setCropEditing(false);
    setOpenMenuIndex(null);
  };

  const beginCrop = async () => {
    if (!step.photo || !mediaRef.current) { setOpenMenuIndex(null); return; }
    try {
      const bounds = mediaRef.current.getBoundingClientRect();
      const size = await readImageSize(step.photo);
      const imageRect = containRectForAspect(size.width, size.height, bounds.width || 1, bounds.height || 1);
      setCropImageRect(imageRect);
      setCropDraft(imageRect);
      setCropEditing(true);
      setOpenMenuIndex(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : tr('Fotoğraf kırpma modu başlatılamadı.', lang));
    }
  };

  const cancelCrop = () => {
    setCropBusy(false);
    setCropEditing(false);
    setOpenMenuIndex(null);
    cropSessionRef.current = null;
  };

  const applyCrop = async () => {
    if (!step.photo) { cancelCrop(); return; }
    try {
      setCropBusy(true);
      const cropped = await cropStepPhotoDataUrl(step.photo, cropDraft, cropImageRect, lang);
      mutate((d) => {
        const target = d.steps[index];
        if (!target) return;
        target.originalPhoto = target.originalPhoto || target.photo;
        target.photo = cropped;
      });
      setCropEditing(false);
      setOpenMenuIndex(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : tr('Fotoğraf kırpılamadı.', lang));
    } finally {
      setCropBusy(false);
      cropSessionRef.current = null;
    }
  };

  const restoreOriginalPhoto = () => {
    if (!step.originalPhoto || cropBusy) return;
    mutate((d) => {
      const target = d.steps[index];
      if (!target || !target.originalPhoto) return;
      target.photo = target.originalPhoto;
      target.originalPhoto = '';
    });
    setCropEditing(false);
    setCropBusy(false);
    cropSessionRef.current = null;
    setOpenMenuIndex(null);
  };

  const startCropResize = (event: ReactPointerEvent<HTMLButtonElement>, handle: StepCropHandle) => {
    if (!mediaRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    const bounds = mediaRef.current.getBoundingClientRect();
    cropSessionRef.current = {
      handle,
      startClientX: event.clientX,
      startClientY: event.clientY,
      start: cropDraft,
      mediaWidthPx: Math.max(1, bounds.width),
      mediaHeightPx: Math.max(1, bounds.height),
    };
  };

  const startPhotoDrag = (event: ReactDragEvent<HTMLDivElement>) => {
    if (mode !== 'edit' || !step.photo) { event.preventDefault(); return; }
    const target = event.target as HTMLElement | null;
    if (target?.closest('button,input')) { event.preventDefault(); return; }
    setOpenMenuIndex(null);
    setDraggingPhotoIndex(index);
    setDropTargetIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-loto-step-photo', String(index));
    event.dataTransfer.setData('text/plain', String(index));
  };

  const hasExternalFiles = (event: ReactDragEvent<HTMLTableCellElement>) =>
    Array.from(event.dataTransfer.types || []).includes('Files');

  const allowPhotoDrop = (event: ReactDragEvent<HTMLTableCellElement>) => {
    if (mode !== 'edit') return;
    if (hasExternalFiles(event)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      setExternalFileOver(true);
      return;
    }
    if (draggingPhotoIndex === null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTargetIndex(index);
  };

  const dropPhoto = (event: ReactDragEvent<HTMLTableCellElement>) => {
    if (mode !== 'edit') return;
    event.preventDefault();

    if (hasExternalFiles(event) || event.dataTransfer.files.length > 0) {
      event.stopPropagation();
      setExternalFileOver(false);
      setDraggingPhotoIndex(null);
      setDropTargetIndex(null);
      const files = Array.from(event.dataTransfer.files || []);
      const file = files.find((item) => ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(item.type));
      if (!file) {
        window.alert(tr('Bu alana PNG, JPG, WEBP veya GIF fotoğraf bırakabilirsiniz.', lang));
        return;
      }
      if (step.photo && !window.confirm(tr('Bu satırdaki mevcut fotoğraf değiştirilsin mi?', lang))) return;
      void replacePhoto(file);
      return;
    }

    const raw = event.dataTransfer.getData('application/x-loto-step-photo') || event.dataTransfer.getData('text/plain');
    const from = Number(raw);
    setDraggingPhotoIndex(null);
    setDropTargetIndex(null);
    if (!Number.isInteger(from) || from < 0 || from === index) return;
    mutate((d) => {
      if (from >= d.steps.length || index >= d.steps.length) return;
      const sourcePhoto = d.steps[from].photo;
      if (!sourcePhoto) return;
      const sourceOriginalPhoto = d.steps[from].originalPhoto;
      const targetPhoto = d.steps[index].photo;
      const targetOriginalPhoto = d.steps[index].originalPhoto;
      d.steps[index].photo = sourcePhoto;
      d.steps[index].originalPhoto = sourceOriginalPhoto;
      d.steps[from].photo = targetPhoto;
      d.steps[from].originalPhoto = targetOriginalPhoto;
    });
  };

  const dragEnded = () => {
    setDraggingPhotoIndex(null);
    setDropTargetIndex(null);
    setExternalFileOver(false);
  };

  useEffect(() => {
    if (!cropEditing) return;
    const handleMove = (event: PointerEvent) => {
      const session = cropSessionRef.current;
      if (!session) return;
      const dxPct = ((event.clientX - session.startClientX) / session.mediaWidthPx) * 100;
      const dyPct = ((event.clientY - session.startClientY) / session.mediaHeightPx) * 100;
      const next = { ...session.start };
      if (session.handle.includes('w')) next.left = clampPct(session.start.left + dxPct, cropImageRect.left, session.start.right - STEP_CROP_MIN_PCT);
      if (session.handle.includes('e')) next.right = clampPct(session.start.right + dxPct, session.start.left + STEP_CROP_MIN_PCT, cropImageRect.right);
      if (session.handle.includes('n')) next.top = clampPct(session.start.top + dyPct, cropImageRect.top, session.start.bottom - STEP_CROP_MIN_PCT);
      if (session.handle.includes('s')) next.bottom = clampPct(session.start.bottom + dyPct, session.start.top + STEP_CROP_MIN_PCT, cropImageRect.bottom);
      setCropDraft(next);
    };
    const handleUp = () => {
      cropSessionRef.current = null;
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [cropEditing, cropImageRect]);

  const isDropTarget = mode === 'edit' && draggingPhotoIndex !== null && draggingPhotoIndex !== index && dropTargetIndex === index;
  const isDraggingThis = draggingPhotoIndex === index;

  return (
    <td
      className={`step-photo-cell${isDropTarget ? ' step-photo-drop-target' : ''}${externalFileOver ? ' step-photo-external-drop-target' : ''}${isDraggingThis ? ' step-photo-drag-source' : ''}`}
      onDragOver={allowPhotoDrop}
      onDragEnter={allowPhotoDrop}
      onDragLeave={(event) => {
        const related = event.relatedTarget as Node | null;
        if (related && event.currentTarget.contains(related)) return;
        if (externalFileOver) setExternalFileOver(false);
        if (dropTargetIndex === index) setDropTargetIndex(null);
      }}
      onDrop={dropPhoto}
    >
      <div
        className={`step-photo-editor${step.photo ? ' has-photo' : ' empty-photo'}${cropEditing ? ' crop-active' : ''}`}
        draggable={mode === 'edit' && Boolean(step.photo) && !cropEditing}
        onDragStart={startPhotoDrag}
        onDragEnd={dragEnded}
        title={mode === 'edit' && step.photo ? tr('Fotoğrafı tutup başka bir satırın Fotoğraf hücresine sürükleyin', lang) : undefined}
      >
        <input
          ref={fileInputRef}
          className="no-print"
          hidden
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => { void replacePhoto(event.target.files?.[0]); event.currentTarget.value = ''; }}
        />
        <div ref={mediaRef} className="step-photo-media">
          <InlineImage
            src={step.photo}
            showActions={false}
            onChange={(src) => mutate((d) => { d.steps[index].photo = src; d.steps[index].originalPhoto = ''; })}
            placeholder="Fotoğraf ekle"
          />
          {mode === 'edit' && cropEditing && step.photo && (
            <div className="step-photo-crop-overlay no-print" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
              <div
                className="step-photo-crop-selection"
                style={{
                  left: `${cropDraft.left}%`,
                  top: `${cropDraft.top}%`,
                  width: `${Math.max(0, cropDraft.right - cropDraft.left)}%`,
                  height: `${Math.max(0, cropDraft.bottom - cropDraft.top)}%`,
                }}
              >
                {(['nw','n','ne','e','se','s','sw','w'] as StepCropHandle[]).map((handle) => (
                  <button
                    key={handle}
                    type="button"
                    className={`step-photo-crop-handle handle-${handle}`}
                    aria-label={`${tr('Kırpma tutamacı', lang)} ${handle}`}
                    onPointerDown={(event) => startCropResize(event, handle)}
                  />
                ))}
              </div>
              <div className="step-photo-crop-actions">
                {step.originalPhoto && (
                  <button type="button" className="secondary" onClick={(event) => { event.preventDefault(); event.stopPropagation(); restoreOriginalPhoto(); }} disabled={cropBusy}>{tr('Orijinal', lang)}</button>
                )}
                <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); cancelCrop(); }} disabled={cropBusy}>{tr('İptal', lang)}</button>
                <button type="button" className="primary" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void applyCrop(); }} disabled={cropBusy}>{cropBusy ? tr('Uygulanıyor...', lang) : tr('Uygula', lang)}</button>
              </div>
            </div>
          )}
        </div>
        {mode === 'edit' && !cropEditing && (step.photo || clipboardPhoto) && (
          <div
            className="step-photo-menu-wrap no-print"
            data-step-photo-menu-root="true"
            draggable={false}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onDragStart={(event) => { event.preventDefault(); event.stopPropagation(); }}
          >
            <button
              type="button"
              className="step-photo-menu-trigger"
              aria-label={`${index + 1}. ${tr('adım fotoğraf işlemleri', lang)}`}
              title={tr('Fotoğraf işlemleri', lang)}
              aria-expanded={menuOpen}
              onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpenMenuIndex(menuOpen ? null : index); }}
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <div className="step-photo-action-menu" role="menu" aria-label={`${index + 1}. ${tr('adım fotoğraf menüsü', lang)}`}>
                <button type="button" role="menuitem" disabled={!step.photo} onClick={(event) => { event.preventDefault(); event.stopPropagation(); openReplacePicker(); }}><ImagePlus size={13} /> {tr('Değiştir', lang)}</button>
                <button type="button" role="menuitem" disabled={!step.photo} onClick={(event) => { event.preventDefault(); event.stopPropagation(); beginCrop(); }}><Crop size={13} /> {tr('Kırp', lang)}</button>
                <button type="button" role="menuitem" disabled={!step.photo} onClick={(event) => { event.preventDefault(); event.stopPropagation(); copyPhoto(); }}><Copy size={13} /> {tr('Kopyala', lang)}</button>
                <button type="button" role="menuitem" disabled={!clipboardPhoto} onClick={(event) => { event.preventDefault(); event.stopPropagation(); pastePhoto(); }}><ClipboardPaste size={13} /> {tr('Yapıştır', lang)}</button>
                <button type="button" role="menuitem" className="danger" disabled={!step.photo} onClick={(event) => { event.preventDefault(); event.stopPropagation(); removePhoto(); }}><Trash2 size={13} /> {tr('Sil', lang)}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </td>
  );
}

function SortableStepRow({ step, index, clipboardPhoto, setClipboardPhoto, draggingPhotoIndex, setDraggingPhotoIndex, dropTargetIndex, setDropTargetIndex, openMenuIndex, setOpenMenuIndex }: {
  step: Step;
  index: number;
  clipboardPhoto: PhotoClipboard | null;
  setClipboardPhoto: (value: PhotoClipboard | null) => void;
  draggingPhotoIndex: number | null;
  setDraggingPhotoIndex: (index: number | null) => void;
  dropTargetIndex: number | null;
  setDropTargetIndex: (index: number | null) => void;
  openMenuIndex: number | null;
  setOpenMenuIndex: (index: number | null) => void;
}) {
  const lang = useEditorStore((s) => s.document.uiLang);
  const mutate = useEditorStore((s) => s.mutate);
  const mode = useEditorStore((s) => s.mode);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `step-row-${index}`, disabled: mode !== 'edit' });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 35 : undefined, position: 'relative' as const };
  return <tr ref={setNodeRef} style={style} className={`step-row sortable-table-row ${isDragging ? 'table-row-dragging' : ''}`}>
    <TableRowOrderCell index={index} title={`${index + 1}. ${tr('LOTO talimatı adımını sürükle', lang)}`} attributes={attributes} listeners={listeners} />
    <td><InlineText multiline value={tr(step.description, lang)} onChange={(v) => mutate((d) => { d.steps[index].description = v; })} /></td>
    <StepPhotoCell
      step={step}
      index={index}
      clipboardPhoto={clipboardPhoto}
      setClipboardPhoto={setClipboardPhoto}
      draggingPhotoIndex={draggingPhotoIndex}
      setDraggingPhotoIndex={setDraggingPhotoIndex}
      dropTargetIndex={dropTargetIndex}
      setDropTargetIndex={setDropTargetIndex}
      openMenuIndex={openMenuIndex}
      setOpenMenuIndex={setOpenMenuIndex}
    />
    <td></td><td></td><td className="steps-action-anchor"><button type="button" className="table-row-delete-outside no-print" title={tr('LOTO talimatı adımını sil', lang)} aria-label={`${index + 1}. ${tr('LOTO talimatı adımını sil', lang)}`} onClick={() => mutate((d) => { d.steps.splice(index, 1); d.steps.forEach((x, i) => { x.no = i + 1; }); })}><Trash2 size={15} strokeWidth={1.8} /></button></td>
  </tr>;
}

export function SopStepsSection() {
  const document = useEditorStore((s) => s.document);
  const lang = document.uiLang;
  const mutate = useEditorStore((s) => s.mutate);
  const [clipboardPhoto, setClipboardPhoto] = useState<PhotoClipboard | null>(null);
  const [draggingPhotoIndex, setDraggingPhotoIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [openPhotoMenuIndex, setOpenPhotoMenuIndex] = useState<number | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      // Do not close while interacting with the active trigger/menu itself.
      if (target?.closest('[data-step-photo-menu-root="true"]')) return;
      setOpenPhotoMenuIndex(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenPhotoMenuIndex(null);
    };
    window.document.addEventListener('pointerdown', handlePointerDown);
    window.document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.document.removeEventListener('pointerdown', handlePointerDown);
      window.document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const groups = [] as typeof document.steps[];
  for (let i = 0; i < document.steps.length; i += 6) groups.push(document.steps.slice(i, i + 6));
  if (!groups.length) groups.push([]);
  const stepIds = document.steps.map((_, index) => `step-row-${index}`);
  return <SortableContext items={stepIds} strategy={verticalListSortingStrategy}><>{groups.map((steps, pageIndex) => <section className="a4-page" key={pageIndex}><DocumentHeader title="LOTO STANDART OPERASYON PROSEDÜRÜ" /><table className="steps-table"><thead><tr><th className="left" colSpan={6}>{pageIndex ? tr('5. LOTO Talimatı - devam', lang) : tr('5. LOTO Talimatı', lang)}</th></tr><tr><th>{tr('Adım', lang)}</th><th>{tr('Açıklama', lang)}</th><th>{tr('Fotoğraf', lang)}</th><th>{tr('Yetkili', lang)}</th><th>{tr('Onaylayan', lang)}</th><th>{tr('Doğrulayan', lang)}</th></tr></thead><tbody>{steps.map((step, localIndex) => { const index = pageIndex * 6 + localIndex; return <SortableStepRow
        step={step}
        index={index}
        key={`step-${index}`}
        clipboardPhoto={clipboardPhoto}
        setClipboardPhoto={setClipboardPhoto}
        draggingPhotoIndex={draggingPhotoIndex}
        setDraggingPhotoIndex={setDraggingPhotoIndex}
        dropTargetIndex={dropTargetIndex}
        setDropTargetIndex={setDropTargetIndex}
        openMenuIndex={openPhotoMenuIndex}
        setOpenMenuIndex={setOpenPhotoMenuIndex}
      />; })}</tbody></table>
      {pageIndex === groups.length - 1 && <><button className="inline-add no-print" onClick={() => mutate((d) => { d.steps.push(blankStep(d.steps.length + 1)); })}><Plus size={16} /> {tr('Adım ekle', lang)}</button><div className="commissioning"><div className="section-title">{tr('6. Devreye Alma', lang)}</div><p>{tr('* Kilitleme adımlarını ters sırayla izleyerek izolasyon kaldırma işlemini gerçekleştirin.', lang)}</p><PersonTable title="Devreye Alma Kişileri" peopleKey="commissioning" /></div></>}
      
    </section>)}</></SortableContext>;
}
