import { useMemo, useState } from "react";
import { getRelType } from "../../constants/Constants";
import { FACTION_ICONS } from "../../constants/factionIcons";

const extractYear = (value) => {
  if (!value) return null;
  const match = value.match(/-?\d+/);
  if (!match) return null;
  const year = parseInt(match[0], 10);
  return Number.isFinite(year) ? year : null;
};

export default function FamilyTree({ store }) {
  const { characters, factions, selectedCharacterId, setSelectedCharacterId, saveCharacter, currentYear } = store;
  const [relTargetId, setRelTargetId] = useState("");
  const [relType, setRelType] = useState("ally");
  const [hoveredCharId, setHoveredCharId] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const parsedCurrentYear = Number.isFinite(Number(currentYear)) ? Number(currentYear) : 0;
  const NODE_W = 190;
  const NODE_H = 78;
  const X_GAP = 34;
  const Y_GAP = 92;
  const PAD = 28;

  const getAgeLabel = (char) => {
    const birth = extractYear(char.birthDate);
    if (birth === null) return null;
    if (char.deathDate) {
      const death = extractYear(char.deathDate);
      return death !== null ? `${death - birth} yrs at death` : null;
    }
    return birth > parsedCurrentYear ? `Born ${birth}` : `${parsedCurrentYear - birth} yrs`;
  };

  const byId = useMemo(() => {
    const map = new Map();
    characters.forEach((c) => map.set(c.id, c));
    return map;
  }, [characters]);

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId) || null;

  const generations = useMemo(() => {
    const gen = new Map();
    const childrenByParent = new Map();

    characters.forEach((c) => {
      (c.parentIds || []).forEach((pid) => {
        if (!byId.has(pid)) return;
        if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
        childrenByParent.get(pid).push(c.id);
      });
    });

    const queue = [];
    characters.forEach((c) => {
      const validParents = (c.parentIds || []).filter((pid) => byId.has(pid));
      if (validParents.length === 0) {
        gen.set(c.id, 0);
        queue.push(c.id);
      }
    });

    while (queue.length > 0) {
      const id = queue.shift();
      const base = gen.get(id) ?? 0;
      (childrenByParent.get(id) || []).forEach((childId) => {
        const next = base + 1;
        const current = gen.get(childId);
        if (current == null || next > current) {
          gen.set(childId, next);
          queue.push(childId);
        }
      });
    }

    characters.forEach((c) => {
      if (!gen.has(c.id)) gen.set(c.id, 0);
    });

    for (let pass = 0; pass < characters.length; pass++) {
      let changed = false;
      characters.forEach((char) => {
        const hasParents = (char.parentIds || []).some((pid) => byId.has(pid));
        if (hasParents) return;
        const spouseIds = new Set([...(char.spouseIds || [])]);
        characters.forEach((other) => {
          if ((other.spouseIds || []).includes(char.id)) spouseIds.add(other.id);
        });
        const spouseGenerations = [...spouseIds].map((sid) => gen.get(sid)).filter((g) => g != null);
        if (spouseGenerations.length === 0) return;
        const nextGen = Math.min(...spouseGenerations);
        if (gen.get(char.id) !== nextGen) {
          gen.set(char.id, nextGen);
          changed = true;
        }
      });
      if (!changed) break;
    }

    return gen;
  }, [characters, byId]);

  const familySections = useMemo(() => {
    const groups = new Map();
    characters.forEach((char) => {
      const key = (char.familyGroup || "").trim() || "unassigned";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(char);
    });

    const sections = Array.from(groups.entries()).map(([familyGroup, members]) => {
      const label = familyGroup === "unassigned" ? "Unassigned Family" : familyGroup;
      const maxGeneration = members.reduce((max, m) => Math.max(max, generations.get(m.id) ?? 0), 0);
      const generationRows = Array.from({ length: maxGeneration + 1 }, (_, i) => i).map((generation) => ({
        generation,
        people: members
          .filter((m) => (generations.get(m.id) ?? 0) === generation)
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name)),
      }));

      const positions = new Map();
      generationRows.forEach((row) => {
        row.people.forEach((person, index) => {
          positions.set(person.id, {
            x: PAD + index * (NODE_W + X_GAP),
            y: PAD + row.generation * (NODE_H + Y_GAP),
          });
        });
      });

      const width = Math.max(
        680,
        ...generationRows.map((row) => PAD * 2 + row.people.length * NODE_W + Math.max(0, row.people.length - 1) * X_GAP)
      );
      const height = PAD * 2 + (maxGeneration + 1) * NODE_H + maxGeneration * Y_GAP;

      return { familyGroup, label, memberCount: members.length, members, generationRows, positions, width, height };
    });

    return sections.sort((a, b) => {
      if (a.familyGroup === "unassigned") return 1;
      if (b.familyGroup === "unassigned") return -1;
      return a.label.localeCompare(b.label);
    });
  }, [characters, generations]);

  const jumpToCharacters = (characterId) => {
    setSelectedCharacterId(characterId);
    window.dispatchEvent(new CustomEvent("switch-section", { detail: { section: "characters" } }));
  };

  const addRelationshipFromTree = () => {
    if (!selectedCharacterId || !relTargetId || relTargetId === selectedCharacterId) return;
    const source = byId.get(selectedCharacterId);
    if (!source) return;
    const existing = source.relationships || [];
    const next = [...existing.filter((r) => !(r.targetId === relTargetId && r.type === relType)), { targetId: relTargetId, type: relType }];
    saveCharacter({ relationships: next }, selectedCharacterId);
  };

  const removeRelationshipFromTree = (targetId, type) => {
    if (!selectedCharacterId) return;
    const source = byId.get(selectedCharacterId);
    if (!source) return;
    const next = (source.relationships || []).filter((r) => !(r.targetId === targetId && r.type === type));
    saveCharacter({ relationships: next }, selectedCharacterId);
  };

  return (
    <div className="h-full bg-[var(--bg-main)] overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)]">Family Tree</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Classic tree layout by family and generation.</p>
          </div>
          <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-nav)] border border-[var(--border)] rounded px-3 py-2">
            Current Year: <span className="text-[var(--accent)] font-bold">{parsedCurrentYear}</span>
          </div>
        </div>

        {characters.length === 0 ? (
          <div className="h-[60vh] flex items-center justify-center text-[var(--text-muted)] italic border border-dashed border-[var(--border)] rounded-xl">
            Add characters to start building your family tree.
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_280px] gap-4 items-start">
            <div className="space-y-6">
              {familySections.map((section) => (
                <section key={section.familyGroup} className="bg-[var(--bg-nav)] border border-[var(--border)] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-[var(--text-main)]">{section.label}</h2>
                      <p className="text-xs text-[var(--text-muted)]">{section.memberCount} characters</p>
                    </div>
                  </div>

                  <div className="overflow-auto rounded-lg border border-[var(--border)] bg-[var(--bg-main)] tree-container relative">
                    <svg width={section.width} height={section.height} className="block min-w-full">
                      {section.generationRows.map((row) => (
                        <text
                          key={`gen-${row.generation}`}
                          x={12}
                          y={PAD + row.generation * (NODE_H + Y_GAP) - 8}
                          fill="var(--text-muted)"
                          fontSize="10"
                          fontWeight="700"
                          style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
                        >
                          Generation {row.generation + 1}
                        </text>
                      ))}

                      {section.members.map((child) => {
                        const childPos = section.positions.get(child.id);
                        if (!childPos) return null;
                        const parentIds = (child.parentIds || []).filter((pid) => section.positions.has(pid));
                        if (parentIds.length === 0) return null;
                        const childX = childPos.x + NODE_W / 2;
                        const childY = childPos.y;
                        if (parentIds.length === 1) {
                          const parentPos = section.positions.get(parentIds[0]);
                          return <line key={`pc-${parentIds[0]}-${child.id}`} x1={parentPos.x + NODE_W / 2} y1={parentPos.y + NODE_H} x2={childX} y2={childY} stroke="var(--border)" strokeWidth="1.7" />;
                        }
                        const parentAnchors = parentIds.map((pid) => {
                          const p = section.positions.get(pid);
                          return { pid, x: p.x + NODE_W / 2, y: p.y + NODE_H };
                        });
                        const minX = Math.min(...parentAnchors.map((p) => p.x));
                        const maxX = Math.max(...parentAnchors.map((p) => p.x));
                        const splitY = childY - 26;
                        return (
                          <g key={`pc-split-${child.id}`}>
                            <line x1={childX} y1={childY} x2={childX} y2={splitY} stroke="var(--border)" strokeWidth="1.7" />
                            <line x1={minX} y1={splitY} x2={maxX} y2={splitY} stroke="var(--border)" strokeWidth="1.7" />
                            {parentAnchors.map((p) => (
                              <line key={`pc-branch-${p.pid}-${child.id}`} x1={p.x} y1={p.y} x2={p.x} y2={splitY} stroke="var(--border)" strokeWidth="1.7" />
                            ))}
                          </g>
                        );
                      })}

                      {section.members.map((char) => {
                        const p1 = section.positions.get(char.id);
                        if (!p1) return null;
                        const spouseIds = new Set([...(char.spouseIds || [])]);
                        section.members.forEach((m) => {
                          if ((m.spouseIds || []).includes(char.id)) spouseIds.add(m.id);
                        });
                        return [...spouseIds]
                          .filter((sid) => sid > char.id && section.positions.has(sid))
                          .map((sid) => {
                            const p2 = section.positions.get(sid);
                            return <line key={`spouse-${char.id}-${sid}`} x1={p1.x + NODE_W} y1={p1.y + NODE_H / 2} x2={p2.x} y2={p2.y + NODE_H / 2} stroke="var(--accent)" strokeWidth="2.2" />;
                          });
                      })}

                      {section.members.map((char) => {
                        const source = section.positions.get(char.id);
                        if (!source) return null;
                        return (char.relationships || [])
                          .filter((rel) => section.positions.has(rel.targetId))
                          .filter((rel) => rel.targetId > char.id)
                          .map((rel) => {
                            const target = section.positions.get(rel.targetId);
                            const relCfg = getRelType(rel.type);
                            return (
                              <line
                                key={`rel-${char.id}-${rel.targetId}-${rel.type}`}
                                x1={source.x + NODE_W / 2}
                                y1={source.y + NODE_H / 2}
                                x2={target.x + NODE_W / 2}
                                y2={target.y + NODE_H / 2}
                                stroke={relCfg.color || "var(--text-muted)"}
                                strokeWidth="1.6"
                                strokeDasharray={relCfg.dash || "4 3"}
                                opacity="0.8"
                              />
                            );
                          });
                      })}

                      {section.members.map((char) => {
                        const p = section.positions.get(char.id);
                        if (!p) return null;
                        const ageLabel = getAgeLabel(char);
                        const faction = factions.find((f) => f.id === char.factionId);
                        const icon = FACTION_ICONS.find((i) => i.id === faction?.iconId)?.url;
                        return (
                          <g
                            key={`node-${char.id}`}
                            className="tree-node"
                            style={{ cursor: "pointer" }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const containerRect = e.currentTarget.closest('.tree-container')?.getBoundingClientRect() || rect;
                              setHoverPosition({
                                x: rect.left - containerRect.left + NODE_W / 2,
                                y: rect.top - containerRect.top - 8
                              });
                              setHoveredCharId(char.id);
                            }}
                            onMouseLeave={() => setHoveredCharId(null)}
                          >
                            <rect x={p.x} y={p.y} width={NODE_W} height={NODE_H} rx="9" fill="var(--bg-nav)" stroke={selectedCharacterId === char.id ? "var(--accent)" : "var(--border)"} strokeWidth={selectedCharacterId === char.id ? "2.6" : "1.4"} onClick={() => setSelectedCharacterId(char.id)} />
                            <text x={p.x + 10} y={p.y + 21} fill="var(--text-main)" fontSize="12" fontWeight="700">{char.name}</text>
                            <text x={p.x + 10} y={p.y + 38} fill="var(--text-muted)" fontSize="10">{char.role || "Character"}</text>
                            {ageLabel && <text x={p.x + 10} y={p.y + 56} fill="var(--accent)" fontSize="10" fontWeight="600">Age: {ageLabel}</text>}
                          </g>
                        );
                      })}
                    </svg>
                    {/* Floating hover card - rendered outside SVG for proper z-index */}
                    {hoveredCharId && (() => {
                      const char = characters.find(c => c.id === hoveredCharId);
                      if (!char) return null;
                      const faction = factions.find(f => f.id === char.factionId);
                      const icon = FACTION_ICONS.find(i => i.id === faction?.iconId)?.url;
                      return (
                        <div
                          className="absolute z-50 pointer-events-none"
                          style={{
                            left: hoverPosition.x,
                            top: hoverPosition.y,
                            transform: 'translate(-50%, -100%)'
                          }}
                        >
                          <div className="w-64 bg-slate-900/95 backdrop-blur-md border-2 border-amber-500/60 rounded-xl p-4 shadow-2xl">
                            <div className="flex items-center gap-2 mb-2">
                              {icon && <img src={icon} alt="" className="w-5 h-5 opacity-80" />}
                              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">{faction?.name || "No Faction"}</span>
                            </div>
                            <div className="text-sm text-white font-bold mb-1">{char.name}</div>
                            <p className="text-[11px] text-slate-300 leading-relaxed">{char.bio?.trim() || "No biography snippet available."}</p>
                          </div>
                          {/* Arrow pointer */}
                          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-slate-900/95 backdrop-blur-md border-r-2 border-b-2 border-amber-500/60 rotate-45"></div>
                        </div>
                      );
                    })()}
                  </div>
                </section>
              ))}
            </div>

            <aside className="bg-[var(--bg-nav)] border border-[var(--border)] rounded-xl p-3 sticky top-4">
              <h3 className="text-sm font-bold text-[var(--text-main)] mb-2">Tree Relationships</h3>
              {!selectedCharacter ? (
                <p className="text-xs text-[var(--text-muted)]">Select a character node to edit links.</p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-[var(--text-muted)]">Selected</div>
                    <div className="text-sm text-[var(--text-main)] font-semibold">{selectedCharacter.name}</div>
                  </div>
                  <select value={relTargetId} onChange={(e) => setRelTargetId(e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-2 py-1.5 text-xs text-[var(--text-main)]">
                    <option value="">Select target character</option>
                    {characters.filter((c) => c.id !== selectedCharacter.id).map((c) => <option key={`target-${c.id}`} value={c.id}>{c.name}</option>)}
                  </select>
                  <select value={relType} onChange={(e) => setRelType(e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-2 py-1.5 text-xs text-[var(--text-main)]">
                    {["enemy", "ally", "romantic", "friend", "partner", "sibling", "cousin", "auntuncle", "grandparent"].map((id) => {
                      const t = getRelType(id);
                      return <option key={`type-${id}`} value={id}>{t.label}</option>;
                    })}
                  </select>
                  <button onClick={addRelationshipFromTree} className="w-full bg-[var(--accent)] text-[var(--bg-main)] text-xs font-bold py-1.5 rounded hover:opacity-90">Add Link</button>

                  <div className="border-t border-[var(--border)] pt-2">
                    <div className="text-xs text-[var(--text-muted)] mb-1">Existing links</div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {(selectedCharacter.relationships || []).length === 0 && <p className="text-xs text-[var(--text-muted)] italic">No custom links yet.</p>}
                      {(selectedCharacter.relationships || []).map((rel, idx) => {
                        const target = byId.get(rel.targetId);
                        if (!target) return null;
                        return (
                          <div key={`existing-${idx}`} className="flex items-center justify-between text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded px-2 py-1">
                            <span className="text-[var(--text-main)]">{target.name} - {getRelType(rel.type).label}</span>
                            <button onClick={() => removeRelationshipFromTree(rel.targetId, rel.type)} className="text-red-400">✕</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button onClick={() => jumpToCharacters(selectedCharacter.id)} className="w-full border border-[var(--border)] text-[var(--text-main)] text-xs py-1.5 rounded hover:border-[var(--accent)]">
                    Open in Characters
                  </button>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
