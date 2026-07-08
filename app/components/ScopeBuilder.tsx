"use client";

import { useEffect, useRef, useState } from "react";
import type { ScopeItem, SectionKey, Tier, CustomRoom, RoomType } from "@/app/lib/types";
import {
  SECTIONS,
  CONTINGENCY_PCT,
  itemTotal,
  itemSection,
  parseUserNumber,
  scopeSubtotal,
  sectionSubtotal,
  roomSubtotal,
  scopeTotal,
} from "@/app/lib/types";
import { blankItem, blankRoomItem, makeRoom, hintFor, ROOM_TYPES } from "@/app/lib/scopeTemplate";
import { ItemPhotoButton } from "@/app/components/PhotoPicker";
import { deletePhoto } from "@/app/lib/photos";

function usd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function inputClass(extra = "") {
  return `w-full bg-slate-800 border border-slate-700 rounded-lg py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm ${extra}`;
}

// Priority dot color by tier (1 = critical → 3 = cosmetic)
const TIER_DOT: Record<Tier, string> = {
  1: "bg-red-400",
  2: "bg-sky-400",
  3: "bg-emerald-400",
};

// Numeric input that keeps a local draft while typing and commits on change and
// again on blur — Enter and Tab both leave the field, so all three paths commit.
// type="text" (not "number") so pasted money formatting like "$8,500" reaches
// our parser instead of being silently discarded by the browser's number widget.
function NumberField({
  value,
  onCommit,
  placeholder,
  className,
}: {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  className: string;
}) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);

  // Adopt outside changes (e.g. switching deals) while the field isn't being edited.
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);

  const invalid = draft.trim() !== "" && parseUserNumber(draft) === null;

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      placeholder={placeholder}
      onChange={(e) => {
        setDraft(e.target.value);
        onCommit(e.target.value);
      }}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={(e) => {
        focused.current = false;
        // Normalize valid entries ("$8,500" → "8500") so the field, the stored
        // value, and the math always agree; invalid text is kept and flagged.
        const parsed = parseUserNumber(e.target.value);
        const committed = parsed === null ? e.target.value : String(parsed);
        setDraft(committed);
        onCommit(committed);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      aria-invalid={invalid || undefined}
      className={`${className} ${
        invalid ? "!border-red-500 focus:!border-red-500 focus:!ring-red-500" : ""
      }`}
    />
  );
}

// Shared line-item row (used by both fixed areas and rooms). Must stay a
// top-level component: defining it inside ScopeBuilder gives it a new identity
// every render, which remounts the inputs and drops focus mid-keystroke.
function ItemRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: ScopeItem;
  onUpdate: (id: string, patch: Partial<ScopeItem>) => void;
  onRemove: (id: string) => void;
}) {
  const total = itemTotal(item);
  const qty = parseUserNumber(item.quantity);
  const cost = parseUserNumber(item.unitCost);
  const qtyInvalid = item.quantity.trim() !== "" && qty === null;
  const costInvalid = item.unitCost.trim() !== "" && cost === null;
  // Explain a $0 total: one side is priced but the other is missing.
  const needsQty = !qtyInvalid && cost !== null && cost > 0 && (qty === null || qty === 0);
  const needsCost = !costInvalid && qty !== null && qty > 0 && cost === null;
  const hint = hintFor(item.description);
  const showTypical = hint !== "0" && item.unitCost.trim() === "";
  return (
    <div className="grid grid-cols-2 sm:grid-cols-[2.5rem_1fr_5rem_6.5rem_6rem_2rem] gap-2 items-center bg-slate-950/40 sm:bg-transparent rounded-lg sm:rounded-none p-2.5 sm:p-0">
      <div className="col-span-2 sm:col-span-1 flex items-center gap-2 sm:block">
        <ItemPhotoButton
          photoId={item.photoId}
          onChange={(photoId) => onUpdate(item.id, { photoId })}
        />
        <input
          type="text"
          value={item.description}
          onChange={(e) => onUpdate(item.id, { description: e.target.value })}
          placeholder="Describe the work…"
          className={inputClass("px-3 sm:hidden")}
        />
      </div>
      <input
        type="text"
        value={item.description}
        onChange={(e) => onUpdate(item.id, { description: e.target.value })}
        placeholder="Describe the work…"
        className={inputClass("px-3 hidden sm:block")}
      />
      <div>
        <NumberField
          value={item.quantity}
          onCommit={(quantity) => onUpdate(item.id, { quantity })}
          placeholder="0"
          className={inputClass("pl-3 pr-2")}
        />
        {qtyInvalid && (
          <p className="mt-1 text-[10px] leading-tight text-red-400">Enter a number</p>
        )}
        {needsQty && (
          <p className="mt-1 text-[10px] leading-tight text-amber-500">Add qty</p>
        )}
      </div>
      <div>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
            $
          </span>
          <NumberField
            value={item.unitCost}
            onCommit={(unitCost) => onUpdate(item.id, { unitCost })}
            className={inputClass("pl-6 pr-2")}
          />
        </div>
        {costInvalid ? (
          <p className="mt-1 text-[10px] leading-tight text-red-400">Enter a number</p>
        ) : needsCost ? (
          <p className="mt-1 text-[10px] leading-tight text-amber-500">
            Add cost{hint !== "0" ? ` — typical ${hint}` : ""}
          </p>
        ) : showTypical ? (
          <p className="mt-1 text-[10px] leading-tight text-slate-500">Typical {hint}</p>
        ) : null}
      </div>
      <div className="text-right">
        <span
          className={`font-medium tabular-nums text-sm ${
            total > 0 ? "text-slate-100" : "text-slate-600"
          }`}
        >
          {usd(total)}
        </span>
        <span className="block text-[10px] text-slate-600 leading-none">
          {item.unit !== "job" || total > 0 ? `per ${item.unit}` : ""}
        </span>
      </div>
      <button
        onClick={() => onRemove(item.id)}
        title="Remove item"
        className="justify-self-end sm:justify-self-center text-slate-600 hover:text-red-400 transition-colors text-sm px-1"
      >
        ✕
      </button>
    </div>
  );
}

interface ScopeBuilderProps {
  items: ScopeItem[];
  rooms: CustomRoom[];
  contingencyEnabled: boolean;
  onItemsChange: (items: ScopeItem[]) => void;
  onRoomsChange: (rooms: CustomRoom[]) => void;
  onContingencyChange: (enabled: boolean) => void;
}

export default function ScopeBuilder({
  items,
  rooms,
  contingencyEnabled,
  onItemsChange,
  onRoomsChange,
  onContingencyChange,
}: ScopeBuilderProps) {
  // Fixed areas start collapsed; rooms default expanded (not in this map → false).
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    SECTIONS.reduce((acc, s) => ({ ...acc, [s.key]: true }), {})
  );
  const [addRoomOpen, setAddRoomOpen] = useState(false);

  const isCollapsed = (key: string) => collapsed[key] ?? false;

  function toggle(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !isCollapsed(key) }));
  }

  function setAll(collapsedValue: boolean) {
    const next: Record<string, boolean> = {};
    SECTIONS.forEach((s) => (next[s.key] = collapsedValue));
    rooms.forEach((r) => (next[r.id] = collapsedValue));
    setCollapsed(next);
  }

  function updateItem(id: string, patch: Partial<ScopeItem>) {
    onItemsChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removeItem(id: string) {
    const item = items.find((it) => it.id === id);
    if (item?.photoId) void deletePhoto(item.photoId);
    onItemsChange(items.filter((it) => it.id !== id));
  }

  function addSectionItem(section: SectionKey) {
    onItemsChange([...items, blankItem(section)]);
    setCollapsed((prev) => ({ ...prev, [section]: false }));
  }

  function addRoom(type: RoomType) {
    const { room, items: roomItems } = makeRoom(type, rooms);
    onRoomsChange([...rooms, room]);
    onItemsChange([...items, ...roomItems]);
    setCollapsed((prev) => ({ ...prev, [room.id]: false }));
    setAddRoomOpen(false);
  }

  function addRoomLine(room: CustomRoom) {
    onItemsChange([...items, blankRoomItem(room)]);
  }

  function renameRoom(roomId: string, name: string) {
    onRoomsChange(rooms.map((r) => (r.id === roomId ? { ...r, name } : r)));
  }

  function deleteRoom(room: CustomRoom) {
    if (!window.confirm(`Remove "${room.name}" and its line items?`)) return;
    items
      .filter((it) => it.roomId === room.id && it.photoId)
      .forEach((it) => void deletePhoto(it.photoId));
    onItemsChange(items.filter((it) => it.roomId !== room.id));
    onRoomsChange(rooms.filter((r) => r.id !== room.id));
  }

  const subtotal = scopeSubtotal(items);
  const contingencyAmount = contingencyEnabled ? subtotal * CONTINGENCY_PCT : 0;
  const grandTotal = scopeTotal(items, contingencyEnabled);
  const pricedCount = items.filter((it) => itemTotal(it) > 0).length;
  const allCollapsed =
    SECTIONS.every((s) => isCollapsed(s.key)) && rooms.every((r) => isCollapsed(r.id));

  const colLabels = (
    <div className="hidden sm:grid grid-cols-[2.5rem_1fr_5rem_6.5rem_6rem_2rem] gap-2 px-5 pt-3 pb-1 text-xs text-slate-600 uppercase tracking-wider font-medium">
      <span>Photo</span>
      <span>Item</span>
      <span>Qty</span>
      <span>Unit Cost</span>
      <span className="text-right">Total</span>
      <span />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-900 rounded-xl border border-slate-800 px-4 py-3">
        <div className="text-sm text-slate-400 min-w-0">
          <span className="font-semibold text-slate-200">{pricedCount}</span>{" "}
          line item{pricedCount === 1 ? "" : "s"} priced
          <span className="hidden sm:inline text-slate-600">
            {" "}· {SECTIONS.length} areas{rooms.length > 0 ? ` + ${rooms.length} room${rooms.length === 1 ? "" : "s"}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setAll(!allCollapsed)}
            className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            {allCollapsed ? "Expand all" : "Collapse all"}
          </button>
          {/* Add a room */}
          <div className="relative">
            <button
              onClick={() => setAddRoomOpen((v) => !v)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 transition-colors"
            >
              + Add a room
            </button>
            {addRoomOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setAddRoomOpen(false)} />
                <div className="absolute right-0 mt-1 z-20 w-52 max-h-72 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-xl py-1">
                  <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Choose a room to add
                  </p>
                  {ROOM_TYPES.map((rt) => (
                    <button
                      key={rt.type}
                      onClick={() => addRoom(rt.type)}
                      className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-amber-500/15 hover:text-amber-300 transition-colors"
                    >
                      {rt.menuLabel}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fixed areas */}
      {SECTIONS.map((section) => {
        const sectionItems = items.filter((it) => !it.roomId && itemSection(it) === section.key);
        const sSubtotal = sectionSubtotal(items, section.key);
        const collapsedNow = isCollapsed(section.key);
        const filledCount = sectionItems.filter((it) => itemTotal(it) > 0).length;

        return (
          <section
            key={section.key}
            className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden"
          >
            <button
              onClick={() => toggle(section.key)}
              className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-slate-800/40 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`shrink-0 w-2.5 h-2.5 rounded-full ${TIER_DOT[section.tier]}`}
                  title={section.tier === 1 ? "Critical / systems" : section.tier === 2 ? "Value rooms" : "Cosmetic"}
                />
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-100">{section.name}</span>
                  <span className="block text-xs text-slate-500 truncate">{section.subtitle}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                {filledCount > 0 && (
                  <span className="hidden sm:block text-xs text-slate-500">
                    {filledCount} item{filledCount === 1 ? "" : "s"}
                  </span>
                )}
                <span className={`font-bold tabular-nums text-sm ${sSubtotal > 0 ? "text-amber-400" : "text-slate-600"}`}>
                  {usd(sSubtotal)}
                </span>
                <span className="text-slate-500 text-xs select-none">{collapsedNow ? "▸" : "▾"}</span>
              </div>
            </button>

            {!collapsedNow && (
              <div className="border-t border-slate-800">
                {colLabels}
                <div className="px-4 sm:px-5 pb-4 space-y-2">
                  {sectionItems.map((item) => (
                    <ItemRow key={item.id} item={item} onUpdate={updateItem} onRemove={removeItem} />
                  ))}
                  <button
                    onClick={() => addSectionItem(section.key)}
                    className="mt-1 text-xs font-medium text-amber-500 hover:text-amber-300 transition-colors"
                  >
                    + Add line item
                  </button>
                </div>
              </div>
            )}
          </section>
        );
      })}

      {/* User-added rooms */}
      {rooms.map((room) => {
        const roomItems = items.filter((it) => it.roomId === room.id);
        const rSubtotal = roomSubtotal(items, room.id);
        const collapsedNow = isCollapsed(room.id);
        const filledCount = roomItems.filter((it) => itemTotal(it) > 0).length;

        return (
          <section
            key={room.id}
            className="bg-slate-900 rounded-xl border border-amber-900/40 overflow-hidden"
          >
            <div className="w-full flex items-center justify-between px-4 sm:px-5 py-3 gap-3">
              <button
                onClick={() => toggle(room.id)}
                className="flex items-center gap-3 min-w-0 flex-1 text-left"
                title={collapsedNow ? "Expand" : "Collapse"}
              >
                <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${TIER_DOT[room.tier]}`} />
                <span className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold shrink-0">
                  Added room
                </span>
                <span className="text-slate-500 text-xs select-none">{collapsedNow ? "▸" : "▾"}</span>
              </button>
              <input
                type="text"
                value={room.name}
                onChange={(e) => renameRoom(room.id, e.target.value)}
                placeholder="Room name"
                className="flex-1 min-w-0 bg-transparent border-0 border-b border-transparent hover:border-slate-700 focus:border-amber-500 text-sm font-semibold text-slate-100 focus:outline-none py-0.5"
                title="Rename this room"
              />
              <div className="flex items-center gap-3 shrink-0">
                {filledCount > 0 && (
                  <span className="hidden sm:block text-xs text-slate-500">
                    {filledCount} item{filledCount === 1 ? "" : "s"}
                  </span>
                )}
                <span className={`font-bold tabular-nums text-sm ${rSubtotal > 0 ? "text-amber-400" : "text-slate-600"}`}>
                  {usd(rSubtotal)}
                </span>
                <button
                  onClick={() => deleteRoom(room)}
                  title="Remove this room"
                  className="text-slate-600 hover:text-red-400 transition-colors text-sm"
                >
                  🗑
                </button>
              </div>
            </div>

            {!collapsedNow && (
              <div className="border-t border-slate-800">
                {colLabels}
                <div className="px-4 sm:px-5 pb-4 space-y-2">
                  {roomItems.map((item) => (
                    <ItemRow key={item.id} item={item} onUpdate={updateItem} onRemove={removeItem} />
                  ))}
                  <button
                    onClick={() => addRoomLine(room)}
                    className="mt-1 text-xs font-medium text-amber-500 hover:text-amber-300 transition-colors"
                  >
                    + Add line item
                  </button>
                </div>
              </div>
            )}
          </section>
        );
      })}

      {/* Totals */}
      <section className="bg-slate-900 rounded-xl border border-amber-900/50 p-5">
        <div className="flex justify-between items-center py-1.5">
          <span className="text-sm text-slate-400">Scope Subtotal</span>
          <span className="font-medium tabular-nums text-slate-200">{usd(subtotal)}</span>
        </div>

        <div className="flex justify-between items-center py-1.5 border-b border-slate-800 pb-3">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <button
              role="switch"
              aria-checked={contingencyEnabled}
              onClick={() => onContingencyChange(!contingencyEnabled)}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                contingencyEnabled ? "bg-amber-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                  contingencyEnabled ? "translate-x-[1.125rem]" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-slate-400">
              Contingency <span className="text-slate-500">(+15% — recommended for older builds)</span>
            </span>
          </label>
          <span className="font-medium tabular-nums text-slate-200">{usd(contingencyAmount)}</span>
        </div>

        <div className="flex justify-between items-center pt-3">
          <span className="font-semibold text-slate-100">Total Rehab Budget</span>
          <span className="font-bold tabular-nums text-amber-400 text-xl">{usd(grandTotal)}</span>
        </div>
        {grandTotal > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            This total feeds the Deal Analyzer automatically — switch tabs to see the deal update.
          </p>
        )}
      </section>
    </div>
  );
}
