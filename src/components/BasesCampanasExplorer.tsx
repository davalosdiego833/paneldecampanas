import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Folder, FolderOpen, Download, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

interface FileNode {
    type: 'file' | 'directory';
    name: string;
    path: string;
    children?: FileNode[];
}

interface Props {
    themeColor: string;
}

const FileExplorerNode: React.FC<{ node: FileNode; depth?: number; themeColor: string }> = ({ node, depth = 0, themeColor }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (node.type === 'file') {
        return (
            <motion.a
                href={node.path}
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.06)' }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    paddingLeft: `${16 + depth * 24}px`,
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    borderRadius: '8px',
                    marginBottom: '4px',
                    border: '1px solid rgba(255,255,255,0.03)',
                    transition: '0.2s all'
                }}
            >
                <FileText size={18} color="#FF6B6B" />
                <span style={{ flex: 1, fontSize: '0.92rem', fontWeight: 500 }}>{node.name.replace(/\.[^/.]+$/, "")}</span>
                <Download size={16} color="var(--text-secondary)" style={{ opacity: 0.6 }} />
            </motion.a>
        );
    }

    return (
        <div>
            <motion.div
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    paddingLeft: `${16 + depth * 24}px`,
                    cursor: 'pointer',
                    color: themeColor,
                    fontWeight: 600,
                    borderRadius: '8px',
                    marginBottom: '4px'
                }}
            >
                {isOpen ? <FolderOpen size={18} /> : <Folder size={18} />}
                <span style={{ flex: 1, fontSize: '0.95rem' }}>{node.name}</span>
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </motion.div>
            
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        {node.children?.map((child, i) => (
                            <FileExplorerNode key={`${child.path}-${i}`} node={child} depth={depth + 1} themeColor={themeColor} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const BasesCampanasExplorer: React.FC<Props> = ({ themeColor }) => {
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        fetch('/api/bases_campanas')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setFileTree(data);
                } else {
                    setFileTree([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching bases:", err);
                setFileTree([]);
                setLoading(false);
            });
    }, []);

    if (loading) return null;
    if (fileTree.length === 0) return null;

    return (
        <div
            className="glass-card"
            style={{
                textAlign: 'left',
                borderLeft: `4px solid ${themeColor || '#42A5F5'}`,
                marginTop: '20px',
                padding: '18px 24px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
            }}
        >
            {/* Header Desplegable */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(66, 165, 245, 0.12)',
                        border: '1px solid rgba(66, 165, 245, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: themeColor || '#42A5F5'
                    }}>
                        <FolderOpen size={22} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: themeColor || '#42A5F5' }}>
                            Bases de Campañas
                        </h4>
                        <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                            Reglamentos y documentos oficiales en PDF
                        </p>
                    </div>
                </div>

                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)'
                }}>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
            </div>
            
            {/* Contenido Desplegable */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: 'hidden', marginTop: '16px' }}
                    >
                        <div style={{ 
                            background: 'rgba(0,0,0,0.25)', 
                            borderRadius: '14px', 
                            padding: '12px',
                            border: '1px solid var(--glass-border)'
                        }}>
                            {fileTree.map((node, i) => (
                                <FileExplorerNode key={`${node.path}-${i}`} node={node} themeColor={themeColor || "#42A5F5"} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
