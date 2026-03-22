"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Link2, CheckCircle2, ArrowDown, ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";

interface Profile {
  name: string;
  score: number;
  date: string;
  evidence: { label: string; value: number }[];
}

const profiles: Profile[] = [
  {
    name: "Luis Romero",
    score: 64,
    date: "Mar 22, 2026",
    evidence: [
      { label: "Identity", value: 72 },
      { label: "Experience", value: 58 },
      { label: "References", value: 62 },
    ],
  },
  {
    name: "Avery Brooks",
    score: 93,
    date: "Mar 22, 2026",
    evidence: [
      { label: "Identity", value: 96 },
      { label: "Experience", value: 91 },
      { label: "References", value: 92 },
    ],
  },
  {
    name: "Noah Carter",
    score: 88,
    date: "Mar 22, 2026",
    evidence: [
      { label: "Identity", value: 92 },
      { label: "Experience", value: 85 },
      { label: "References", value: 87 },
    ],
  },
  {
    name: "Jordan Applicant",
    score: 90,
    date: "Mar 22, 2026",
    evidence: [
      { label: "Identity", value: 95 },
      { label: "Experience", value: 88 },
      { label: "References", value: 87 },
    ],
  },
  {
    name: "Daniel Kim",
    score: 96,
    date: "Mar 22, 2026",
    evidence: [
      { label: "Identity", value: 98 },
      { label: "Experience", value: 95 },
      { label: "References", value: 94 },
    ],
  },
  {
    name: "Olivia Bennett",
    score: 83,
    date: "Mar 21, 2026",
    evidence: [
      { label: "Identity", value: 88 },
      { label: "Experience", value: 80 },
      { label: "References", value: 81 },
    ],
  },
];

const HASHES = [
  ["a7f3...9c21", "b1e4...3d87"],
  ["d2e8...4b17", "e5c9...6a32"],
  ["c9a1...7f52", "f3d7...8e41"],
  ["8b2f...1c94", "4e6a...2d53"],
  ["7d5e...3f28", "9c1b...5a76"],
  ["6a4d...8e19", "3f7c...4b65"],
];

function generateHash(profileIdx: number, version: number): string {
  return HASHES[profileIdx % HASHES.length][Math.min(version, 1)];
}

type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface ChainBlockData {
  hash: string;
  profileIdx: number;
  isUpdate: boolean;
  name: string;
  blockNum: number;
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#2dd4a8" : "#c8a84e";
  return (
    <svg width={size} height={size} className="block">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#333" strokeWidth={4} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={4}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fill={color} style={{ fontSize: 20 }}>
        {score}
      </text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fill="#777" style={{ fontSize: 10 }}>
        /100
      </text>
    </svg>
  );
}

function ProfileCard({ profile, shimmer }: { profile: Profile; shimmer: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        borderRadius: 12,
        border: "1px solid #333",
        background: "#1a1a1a",
        padding: "1.25rem",
        width: 224,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      <ScoreRing score={profile.score} />
      <motion.div
        style={{ color: "#f0ede6", textAlign: "center" }}
        animate={shimmer ? { opacity: [1, 0.4, 1] } : {}}
        transition={{ duration: 0.6, repeat: 1 }}
      >
        <div style={{ fontSize: 16 }}>{profile.name}</div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{profile.date}</div>
      </motion.div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
        {profile.evidence.map((e) => (
          <motion.div
            key={e.label}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
            animate={shimmer ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span style={{ fontSize: 10, color: "#888", width: 64 }}>{e.label}</span>
            <div style={{ flex: 1, height: 6, background: "#333", borderRadius: 9999, overflow: "hidden" }}>
              <motion.div
                style={{
                  height: "100%",
                  borderRadius: 9999,
                  backgroundColor: e.value >= 80 ? "#2dd4a8" : "#c8a84e",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${e.value}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: "#c8a84e", marginTop: 4 }}>Open public profile →</div>
    </motion.div>
  );
}

function HashCapsule({ hash, typing, traveling }: { hash: string; typing: boolean; traveling: boolean }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!typing) {
      setDisplayed("");
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(hash.slice(0, i + 1));
      i++;
      if (i >= hash.length) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, [typing, hash]);

  return (
    <motion.div
      style={{
        padding: "8px 16px",
        borderRadius: 9999,
        border: "1px solid rgba(200,168,78,0.6)",
        background: "rgba(200,168,78,0.1)",
        color: "#c8a84e",
        fontFamily: "var(--font-mono)",
        fontSize: 14,
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 0 20px rgba(200,168,78,0.15)",
      }}
      animate={traveling ? { y: [0, 40], opacity: [1, 0] } : {}}
      transition={{ duration: 0.5 }}
    >
      <Shield size={14} />
      <span>{displayed || hash}</span>
    </motion.div>
  );
}

function ChainBlockView({ block, isNew }: { block: ChainBlockData; isNew: boolean }) {
  return (
    <motion.div
      style={{
        borderRadius: 8,
        border: "1px solid rgba(45,212,168,0.6)",
        background: "rgba(45,212,168,0.05)",
        boxShadow: "0 0 24px rgba(45,212,168,0.15)",
        padding: 12,
        width: 144,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
      initial={isNew ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ fontSize: 10, color: "#888" }}>Block #{block.blockNum}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#c8a84e" }}>{block.hash}</div>
      <div
        style={{
          fontSize: 10,
          color: "rgba(240,237,230,0.7)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: "100%",
          textAlign: "center",
        }}
      >
        {block.name}
      </div>
      {block.isUpdate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ fontSize: 9, color: "#2dd4a8", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}
        >
          <Link2 size={10} /> Linked Update
        </motion.div>
      )}
    </motion.div>
  );
}

function VerticalConnector({ active }: { active: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <motion.div
        style={{ width: 1, height: 24 }}
        initial={{ backgroundColor: "#333" }}
        animate={{ backgroundColor: active ? "#2dd4a8" : "#333" }}
        transition={{ duration: 0.4 }}
      />
      {active && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{ width: 6, height: 6, borderRadius: 9999, background: "#2dd4a8", marginTop: -2 }}
        />
      )}
    </div>
  );
}

function HorizontalConnector({ active }: { active: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <motion.div
        style={{ height: 1, width: 32 }}
        initial={{ backgroundColor: "#333" }}
        animate={{ backgroundColor: active ? "#2dd4a8" : "#333" }}
        transition={{ duration: 0.4 }}
      />
      {active && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{ width: 6, height: 6, borderRadius: 9999, background: "#2dd4a8" }}
        />
      )}
    </div>
  );
}

function buildChainColumns(blocks: ChainBlockData[]) {
  const columns: { original: ChainBlockData; updates: ChainBlockData[] }[] = [];
  const originalMap = new Map<number, number>();

  for (const block of blocks) {
    if (!block.isUpdate) {
      originalMap.set(block.profileIdx, columns.length);
      columns.push({ original: block, updates: [] });
    } else {
      const colIdx = originalMap.get(block.profileIdx);
      if (colIdx !== undefined) {
        columns[colIdx].updates.push(block);
      } else {
        originalMap.set(block.profileIdx, columns.length);
        columns.push({ original: block, updates: [] });
      }
    }
  }
  return columns;
}

export function BlockchainFlow() {
  const [currentProfile, setCurrentProfile] = useState(0);
  const [stage, setStage] = useState<Stage>(0);
  const [chainBlocks, setChainBlocks] = useState<ChainBlockData[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showUpdateDemo, setShowUpdateDemo] = useState(false);
  const [nextBlockNum, setNextBlockNum] = useState(347);
  const [updateTargetIdx, setUpdateTargetIdx] = useState(0);

  const columns = useMemo(() => buildChainColumns(chainBlocks), [chainBlocks]);
  const lastBlockIdx = chainBlocks.length - 1;

  const runAnimation = useCallback((profileIdx: number, isUpdate = false) => {
    setIsRunning(true);
    setCurrentProfile(profileIdx);
    setShowUpdateDemo(isUpdate);

    const timings = [0, 300, 1200, 2200, 2800, 3800, 4400, 5000, 5600];
    const stages: Stage[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

    stages.forEach((s, i) => {
      setTimeout(() => {
        setStage(s);
        if (s === 6) {
          setNextBlockNum((prev) => {
            const num = prev;
            setChainBlocks((prevBlocks) => {
              const version = prevBlocks.filter((b) => b.profileIdx === profileIdx).length;
              return [
                ...prevBlocks,
                {
                  hash: generateHash(profileIdx, version),
                  profileIdx,
                  isUpdate,
                  name: profiles[profileIdx].name,
                  blockNum: num,
                },
              ];
            });
            return num + 1;
          });
        }
        if (s === 8) setIsRunning(false);
      }, timings[i]);
    });
  }, []);

  const anchoredProfileIdxs = new Set(chainBlocks.filter((b) => !b.isUpdate).map((b) => b.profileIdx));
  const nextUnanchored = profiles.findIndex((_, i) => !anchoredProfileIdxs.has(i));
  const anchoredProfiles = Array.from(anchoredProfileIdxs);

  const handleAnchorNext = () => {
    if (nextUnanchored === -1) return;
    runAnimation(nextUnanchored);
  };

  const handleShowUpdate = () => {
    runAnimation(updateTargetIdx, true);
  };

  const handleReset = () => {
    setChainBlocks([]);
    setStage(0);
    setCurrentProfile(0);
    setIsRunning(false);
    setShowUpdateDemo(false);
    setNextBlockNum(347);
    setUpdateTargetIdx(0);
  };

  const profile = profiles[currentProfile];
  const version = chainBlocks.filter((b) => b.profileIdx === currentProfile).length;
  const hash = generateHash(currentProfile, version);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#f0ede6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 1rem",
        gap: 16,
        overflowX: "auto",
        position: "relative",
      }}
    >
      <Link
        href="/"
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 14,
          color: "#888",
          textDecoration: "none",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#f0ede6")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
      >
        <ArrowLeft size={16} /> Home
      </Link>

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 0 }}>
        <h1 style={{ fontSize: "1.5rem", letterSpacing: "-0.02em", color: "#f0ede6", fontFamily: "inherit", fontWeight: 600, maxWidth: "none" }}>
          Immutable Profile Anchoring
        </h1>
        <p style={{ fontSize: 14, color: "#888", marginTop: 8, maxWidth: 520 }}>
          Watch applicant snapshots get hashed and anchored to the blockchain — creating a tamper-proof,
          verifiable record. Updates link downward from the original block.
        </p>
      </div>

      {/* Animation flow area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          justifyContent: "center",
          flexShrink: 0,
          position: "relative",
          transition: "height 0.5s ease",
          height: stage >= 1 && stage < 8 ? 320 : 32,
        }}
      >
        <AnimatePresence mode="wait">
          {stage >= 1 && stage < 4 && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <div
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#888",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                {showUpdateDemo ? "Updated Snapshot" : "Applicant Snapshot"}
              </div>
              <ProfileCard profile={profile} shimmer={stage >= 2} />
              {stage >= 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#555", marginTop: 8 }}>
                  <ArrowDown size={16} />
                </motion.div>
              )}
            </motion.div>
          )}

          {stage >= 3 && stage < 6 && (
            <motion.div
              key="hashing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
            >
              {stage === 3 && (
                <motion.div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#888" }}>
                    Hashing
                  </div>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      style={{ height: 2, background: "rgba(200,168,78,0.6)", borderRadius: 9999 }}
                      initial={{ width: 160 }}
                      animate={{ width: 40 }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    />
                  ))}
                </motion.div>
              )}
              {stage >= 4 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#888" }}>
                    Hashed Proof
                  </div>
                  <HashCapsule hash={hash} typing={stage === 4} traveling={stage === 5} />
                </div>
              )}
              {stage >= 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#555" }}>
                  <ArrowDown size={16} />
                </motion.div>
              )}
            </motion.div>
          )}

          {stage >= 6 && stage < 8 && (
            <motion.div
              key="anchoring"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            >
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#c8a84e" }}>
                Anchoring to chain...
              </div>
              <ArrowDown size={16} style={{ color: "#c8a84e" }} />
            </motion.div>
          )}

          {stage >= 8 && (
            <motion.div
              key="badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            >
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#2dd4a8" }}>
                {showUpdateDemo ? "Update anchored" : "Snapshot anchored"}
              </div>
            </motion.div>
          )}

          {stage === 0 && chainBlocks.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ color: "#555", fontSize: 14, textAlign: "center" }}
            >
              Click below to anchor a profile
            </motion.div>
          )}

          {stage === 0 && chainBlocks.length > 0 && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ color: "#555", fontSize: 14, textAlign: "center" }}
            >
              {nextUnanchored !== -1
                ? `${profiles.length - anchoredProfileIdxs.size} profiles remaining`
                : "All profiles anchored"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chain visualization */}
      {chainBlocks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#888" }}>
            Blockchain Anchor
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
            {columns.map((col, colIdx) => (
              <div key={colIdx} style={{ display: "flex", alignItems: "flex-start" }}>
                {colIdx > 0 && (
                  <div style={{ display: "flex", alignItems: "center", marginTop: 20 }}>
                    <HorizontalConnector active={true} />
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <ChainBlockView
                    block={col.original}
                    isNew={chainBlocks[lastBlockIdx] === col.original && stage >= 6}
                  />
                  {col.updates.map((upd, uIdx) => (
                    <div key={uIdx} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <VerticalConnector active={true} />
                      <ChainBlockView
                        block={upd}
                        isNew={chainBlocks[lastBlockIdx] === upd && stage >= 6}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badge */}
      <AnimatePresence>
        {stage >= 8 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 9999,
                border: "1px solid rgba(45,212,168,0.4)",
                background: "rgba(45,212,168,0.05)",
              }}
            >
              <CheckCircle2 size={16} style={{ color: "#2dd4a8" }} />
              <span style={{ fontSize: 14, color: "#2dd4a8" }}>
                {showUpdateDemo ? "Linked Update Anchored" : "Blockchain-Ready"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontSize: 10, color: "#666" }}>
              <span>Public Snapshot Verified</span>
              <span>Immutable Version Added</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", alignItems: "flex-end" }}>
        {nextUnanchored !== -1 && (
          <button
            onClick={handleAnchorNext}
            disabled={isRunning}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              background: "rgba(200,168,78,0.15)",
              border: "1px solid rgba(200,168,78,0.4)",
              color: "#c8a84e",
              fontSize: 14,
              cursor: isRunning ? "not-allowed" : "pointer",
              opacity: isRunning ? 0.3 : 1,
              transition: "background 0.2s",
            }}
          >
            Anchor {profiles[nextUnanchored].name}
          </button>
        )}
        {anchoredProfiles.length > 0 && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 10, color: "#888" }}>Update for:</label>
              <select
                value={updateTargetIdx}
                onChange={(e) => setUpdateTargetIdx(Number(e.target.value))}
                style={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  color: "#f0ede6",
                  fontSize: 12,
                  borderRadius: 8,
                  padding: "8px",
                  outline: "none",
                }}
              >
                {anchoredProfiles.map((idx) => (
                  <option key={idx} value={idx}>
                    {profiles[idx].name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleShowUpdate}
              disabled={isRunning}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                background: "rgba(45,212,168,0.1)",
                border: "1px solid rgba(45,212,168,0.3)",
                color: "#2dd4a8",
                fontSize: 14,
                cursor: isRunning ? "not-allowed" : "pointer",
                opacity: isRunning ? 0.3 : 1,
                transition: "background 0.2s",
              }}
            >
              Anchor Update
            </button>
          </div>
        )}
        <button
          onClick={handleReset}
          disabled={isRunning}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            background: "#222",
            border: "1px solid #333",
            color: "#888",
            fontSize: 14,
            cursor: isRunning ? "not-allowed" : "pointer",
            opacity: isRunning ? 0.3 : 1,
            transition: "background 0.2s",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* Steps microcopy */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          fontSize: 11,
          color: "#555",
          marginTop: 8,
          justifyContent: "center",
        }}
      >
        {["Publish profile", "Generate immutable hash", "Anchor public version", "Future verification layer"].map(
          (t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 9999,
                  border: "1px solid #444",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: "#666",
                }}
              >
                {i + 1}
              </span>
              {t}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
