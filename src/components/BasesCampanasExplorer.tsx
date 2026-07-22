import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Folder, FolderOpen, Download, ChevronRight, ChevronDown } from 'lucide-react';

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
                whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.05)' }}
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
                    border: '1px solid rgba(255,255,255,0.02)',
                    transition: '0.2s all'
                }}
            >
                <FileText size={20} color="#FF6B6B" />
                <span style={{ flex: 1, fontSize: '0.95rem' }}>{node.name.replace(/\.[^/.]+$/, "")}</span>
                <Download size={16} color="var(--text-secondary)" style={{ opacity: 0.5 }} />
            </motion.a>
        );
    }

    return (
        <div>
            <motion.div
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
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
                {isOpen ? <FolderOpen size={20} /> : <Folder size={20} />}
                <span style={{ flex: 1, fontSize: '1rem' }}>{node.name}</span>
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
    if (fileTree.length === 0) return null; // No mostrar si no hay archivos

    return (
        <div
            className="glass-card"
            style={{
                textAlign: 'left',
                borderLeft: `4px solid #42A5F5`,
                marginTop: '20px',
                padding: '24px'
            }}
        >
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', color: '#42A5F5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderOpen size={24} /> Bases de Campañas
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Encuentra aquí los reglamentos y bases oficiales para las campañas vigentes.
            </p>
            
            <div style={{ 
                background: 'rgba(0,0,0,0.2)', 
                borderRadius: '12px', 
                padding: '12px',
                border: '1px solid var(--glass-border)'
            }}>
                {fileTree.map((node, i) => (
                    <FileExplorerNode key={`${node.path}-${i}`} node={node} themeColor="#42A5F5" />
                ))}
            </div>
        </div>
    );
};
