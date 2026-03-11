import { App, Plugin, PluginSettingTab, Setting, Notice, TFile, FileSystemAdapter, MarkdownRenderer, arrayBufferToBase64 } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface InstagramPluginSettings {
    exportPath: string;
    createDateFolder: boolean;
    additionalCaption: string;
    stripWikilinks: boolean;
}

const DEFAULT_SETTINGS: InstagramPluginSettings = {
    exportPath: 'Desktop',
    createDateFolder: true,
    additionalCaption: '',
    stripWikilinks: true
}

export default class InstagramPostPreparer extends Plugin {
    settings: InstagramPluginSettings;

    async onload() {
        await this.loadSettings();

        // Add ribbon icon
        const ribbonIconEl = this.addRibbonIcon('camera', 'Instagram: Prepare Post', (evt: MouseEvent) => {
            this.preparePost();
        });
        ribbonIconEl.addClass('instagram-plugin-ribbon-class');

        // Add command
        this.addCommand({
            id: 'prepare-instagram-post',
            name: 'Prepare Post from Current Note',
            callback: () => {
                this.preparePost();
            }
        });

        // Add note.com copy command
        this.addCommand({
            id: 'copy-for-note-com',
            name: 'Copy for note.com (Rich Text with Images)',
            callback: () => {
                this.copyForNoteCom();
            }
        });

        // Add settings tab
        this.addSettingTab(new InstagramSettingTab(this.app, this));
    }

    onunload() {
        // Clean up
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async preparePost() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('No active file found.');
            return;
        }

        new Notice(`Preparing Instagram post for: ${activeFile.basename}`);

        try {
            const content = await this.app.vault.read(activeFile);
            const cache = this.app.metadataCache.getFileCache(activeFile);

            let caption = content;
            const imageFiles: TFile[] = [];

            // Extract images
            if (cache?.embeds) {
                for (const embed of cache.embeds) {
                    if (embed.original) {
                        caption = caption.replace(embed.original, '');
                    }

                    const destFile = this.app.metadataCache.getFirstLinkpathDest(embed.link, activeFile.path);
                    if (destFile instanceof TFile) {
                        const extension = destFile.extension.toLowerCase();
                        if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
                            imageFiles.push(destFile);
                        }
                    }
                }
            }

            // Standard markdown image syntax parsing
            const mdImageRegex = /!\[.*?\]\((?!app:\/\/)(.+?)\)/g;
            let match;
            while ((match = mdImageRegex.exec(content)) !== null) {
                caption = caption.replace(match[0], '');
                const destFile = this.app.metadataCache.getFirstLinkpathDest(match[1], activeFile.path);
                if (destFile instanceof TFile) {
                    const extension = destFile.extension.toLowerCase();
                    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
                        imageFiles.push(destFile);
                    }
                }
            }

            // Strip YAML frontmatter
            caption = caption.replace(/^---\n[\s\S]*?\n---\n/, '');

            // Strip wikilinks if enabled
            if (this.settings.stripWikilinks) {
                caption = caption.replace(/\[\[(?:[^\]|]+)\|([^\]]+)\]\]/g, '$1');
                caption = caption.replace(/\[\[([^\]]+)\]\]/g, '$1');
            }

            caption = caption.trim();

            if (this.settings.additionalCaption.trim().length > 0) {
                caption += '\n\n' + this.settings.additionalCaption;
            }

            // Resolve export path
            let exportBasePath = this.settings.exportPath;
            if (exportBasePath.toLowerCase() === 'desktop') {
                exportBasePath = path.join(os.homedir(), 'Desktop');
            }

            // Folder name
            let folderName = `Instagram_Post_`;
            if (this.settings.createDateFolder) {
                const d = new Date();
                const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                folderName += `${dateString}_`;
            }
            folderName += activeFile.basename.replace(/[^a-zA-Z0-9_\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAFF\-]/g, '_');

            const destDir = path.join(exportBasePath, folderName);
            await fs.promises.mkdir(destDir, { recursive: true });

            const adapter = this.app.vault.adapter;
            let vaultBasePath = '';
            if (adapter instanceof FileSystemAdapter) {
                vaultBasePath = adapter.getBasePath();
            } else {
                new Notice('Error: Vault is not on a local filesystem.');
                return;
            }

            // Copy images over
            let imageCounter = 1;
            const processedImages = new Set<string>();
            for (const imgFile of imageFiles) {
                if (processedImages.has(imgFile.path)) continue;
                processedImages.add(imgFile.path);

                const sourcePath = path.join(vaultBasePath, imgFile.path);
                const numberedFilename = `${String(imageCounter).padStart(2, '0')}_${imgFile.name}`;
                const destPath = path.join(destDir, numberedFilename);

                await fs.promises.copyFile(sourcePath, destPath);
                imageCounter++;
            }

            // Save caption.txt
            await fs.promises.writeFile(path.join(destDir, 'caption.txt'), caption, 'utf-8');

            new Notice(`Successfully prepared post in: ${destDir}`);
        } catch (e: any) {
            console.error('Instagram Post Preparer Error:', e);
            new Notice(`Failed to prepare post: ${e.message}`);
        }
    }

    async copyForNoteCom() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('No active file found.');
            return;
        }

        new Notice(`note.com用に綺麗なテキストを準備中...`);

        try {
            const content = await this.app.vault.read(activeFile);
            const cache = this.app.metadataCache.getFileCache(activeFile);
            let processedContent = content;

            // Strip YAML frontmatter
            processedContent = processedContent.replace(/^---\n[\s\S]*?\n---\n/, '');

            // Replace internal embeds (![[image]])
            if (cache?.embeds) {
                for (const embed of cache.embeds) {
                    const destFile = this.app.metadataCache.getFirstLinkpathDest(embed.link, activeFile.path);
                    if (destFile instanceof TFile) {
                        const extension = destFile.extension.toLowerCase();
                        if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
                            processedContent = processedContent.replace(embed.original, `\n\n[🖼️ ここに画像をドラッグ＆ドロップ: ${destFile.name}]\n\n`);
                        }
                    }
                }
            }

            // Replace standard markdown images (![alt](path))
            const mdImageRegex = /!\[.*?\]\((?!app:\/\/)(.+?)\)/g;
            let match;
            const standardImages = [];
            while ((match = mdImageRegex.exec(content)) !== null) {
                standardImages.push({ original: match[0], link: match[1] });
            }
            for (const img of standardImages) {
                const destFile = this.app.metadataCache.getFirstLinkpathDest(img.link, activeFile.path);
                if (destFile instanceof TFile) {
                    const extension = destFile.extension.toLowerCase();
                    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
                        processedContent = processedContent.split(img.original).join(`\n\n[🖼️ ここに画像をドラッグ＆ドロップ: ${destFile.name}]\n\n`);
                    }
                }
            }

            // Strip non-image wikilinks (convert [[Link\|Text]] to Text)
            processedContent = processedContent.replace(/(^|[^!])\[\[(?:[^\]|]+)\|([^\]]+)\]\]/g, '$1$2');
            processedContent = processedContent.replace(/(^|[^!])\[\[([^\]]+)\]\]/g, '$1$2');

            // Clean up multiple empty lines
            processedContent = processedContent.replace(/\n{3,}/g, '\n\n').trim();

            await navigator.clipboard.writeText(processedContent);

            new Notice('成功！note.com用に綺麗なテキストをコピーしました');

        } catch (e: any) {
            console.error('Note.com Copy Error:', e);
            new Notice(`Failed to copy for note: ${e.message}`);
        }
    }
}

class InstagramSettingTab extends PluginSettingTab {
    plugin: InstagramPostPreparer;

    constructor(app: App, plugin: InstagramPostPreparer) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Export Path')
            .setDesc('Where to save the prepared posts (e.g., Desktop)')
            .addText(text => text
                .setPlaceholder('Desktop')
                .setValue(this.plugin.settings.exportPath)
                .onChange(async (value) => {
                    this.plugin.settings.exportPath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Create Date Folder')
            .setDesc('Create a subfolder with the current date')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.createDateFolder)
                .onChange(async (value) => {
                    this.plugin.settings.createDateFolder = value;
                    await this.plugin.saveSettings();
                }));
    }
}
