/**
 * WYSIWYG Editor - Optimized Version
 * Features: Performance optimized, secure, modular, and accessible
 */

class WYSIWYGEditor {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id '${containerId}' not found`);
    }

    // Configuration with defaults
    this.config = {
      historyLimit: 50,
      autoSaveDelay: 1000,
      debounceDelay: 300,
      ...options
    };

    // State management
    this.state = {
      history: [],
      historyIndex: -1,
      isPreview: false,
      isCodeView: false,
      isFullscreen: false,
      lastSaved: null,
      lastHTML: null
    };

    // Performance optimizations
    this.debounceTimer = null;
    this.autoSaveTimer = null;
    this.observer = null;

    // Initialize
    this.initEditor();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.setupAutoSave();
  }

  initEditor() {
    this.createToolbar();
    this.createEditableArea();
    this.assembleEditor();
    this.recordHistory(); // Initial state
    
    // Check for corrupted content after initialization
    setTimeout(() => {
      this.fixCorruptedContent();
    }, 100);
  }

  createToolbar() {
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'toolbar';
    this.toolbar.setAttribute('role', 'toolbar');
    this.toolbar.setAttribute('aria-label', 'Editor toolbar');

    const buttonGroups = this.getButtonGroups();
    buttonGroups.forEach(group => {
      this.createButtonGroup(group.title, group.buttons);
    });
  }

  getButtonGroups() {
    return [
      {
        title: 'File',
        buttons: [
          { id: 'save', symbol: '💾', title: 'Save (Ctrl+S)', onClick: () => this.saveContent() },
          { id: 'load', symbol: '📂', title: 'Load', onClick: () => this.loadContent() },
          { id: 'export-pdf', symbol: '📄', title: 'Export to PDF', onClick: () => this.exportToPDF() },
          { id: 'export-word', symbol: '📝', title: 'Export to Word', onClick: () => this.exportToWord() },
          { id: 'export-markdown', symbol: '📋', title: 'Export to Markdown', onClick: () => this.exportToMarkdown() },
          { id: 'import-file', symbol: '📥', title: 'Import File', onClick: () => this.importFile() }
        ]
      },
      {
        title: 'Edit',
        buttons: [
          { id: 'undo', symbol: '↶', title: 'Undo (Ctrl+Z)', onClick: () => this.undo() },
          { id: 'redo', symbol: '↷', title: 'Redo (Ctrl+Y)', onClick: () => this.redo() },
          { id: 'cut', symbol: '✂️', title: 'Cut (Ctrl+X)', onClick: () => this.formatText('cut') },
          { id: 'copy', symbol: '📋', title: 'Copy (Ctrl+C)', onClick: () => this.formatText('copy') },
          { id: 'paste', symbol: '📌', title: 'Paste (Ctrl+V)', onClick: () => this.pasteContent() },
          { id: 'find', symbol: '🔍', title: 'Find (Ctrl+F)', onClick: () => this.showFindDialog() },
          { id: 'replace', symbol: '🔄', title: 'Replace (Ctrl+H)', onClick: () => this.showReplaceDialog() }
        ]
      },
      {
        title: 'Format',
        buttons: [
          { id: 'bold', symbol: 'B', title: 'Bold (Ctrl+B)', onClick: () => this.formatText('bold') },
          { id: 'italic', symbol: 'I', title: 'Italic (Ctrl+I)', onClick: () => this.formatText('italic') },
          { id: 'underline', symbol: 'U', title: 'Underline (Ctrl+U)', onClick: () => this.formatText('underline') },
          { id: 'strikethrough', symbol: 'S', title: 'Strikethrough (Ctrl+Shift+S)', onClick: () => this.formatText('strikeThrough') },
          { id: 'subscript', symbol: '₂', title: 'Subscript (Ctrl+,)', onClick: () => this.formatText('subscript') },
          { id: 'superscript', symbol: '²', title: 'Superscript (Ctrl+.)', onClick: () => this.formatText('superscript') },
          { id: 'indent', symbol: '→', title: 'Increase Indent', onClick: () => this.formatText('indent') },
          { id: 'outdent', symbol: '←', title: 'Decrease Indent', onClick: () => this.formatText('outdent') },
          { id: 'rtl', symbol: '⇄', title: 'Right to Left', onClick: () => this.toggleTextDirection() },
          { id: 'remove-format', symbol: '✕', title: 'Remove Formatting', onClick: () => this.formatText('removeFormat') }
        ]
      },
      {
        title: 'Style',
        buttons: [
          { id: 'font-family', type: 'select', name: 'font-family', options: [
            { value: '', label: 'Font' },
            { value: 'Arial, sans-serif', label: 'Arial' },
            { value: 'Times New Roman, serif', label: 'Times New Roman' },
            { value: 'Courier New, monospace', label: 'Courier New' },
            { value: 'Georgia, serif', label: 'Georgia' },
            { value: 'Verdana, sans-serif', label: 'Verdana' },
            { value: 'Helvetica, sans-serif', label: 'Helvetica' },
            { value: 'Comic Sans MS, cursive', label: 'Comic Sans' }
          ], onChange: (value) => this.formatText('fontName', value) },
          { id: 'font-size', type: 'select', name: 'font-size', options: [
            { value: '', label: 'Size' },
            { value: '12px', label: '12px' },
            { value: '14px', label: '14px' },
            { value: '16px', label: '16px' },
            { value: '18px', label: '18px' },
            { value: '20px', label: '20px' },
            { value: '24px', label: '24px' },
            { value: '28px', label: '28px' },
            { value: '32px', label: '32px' },
            { value: '36px', label: '36px' },
            { value: '48px', label: '48px' }
          ], onChange: (value) => this.formatText('fontSize', value) },
          { id: 'heading', type: 'select', name: 'heading', options: [
            { value: '', label: 'Heading' },
            { value: 'h1', label: 'Heading 1' },
            { value: 'h2', label: 'Heading 2' },
            { value: 'h3', label: 'Heading 3' },
            { value: 'h4', label: 'Heading 4' },
            { value: 'h5', label: 'Heading 5' },
            { value: 'h6', label: 'Heading 6' },
            { value: 'p', label: 'Paragraph' }
          ], onChange: (value) => this.formatText('formatBlock', value) },
          { id: 'line-height', type: 'select', name: 'line-height', options: [
            { value: '', label: 'Line Height' },
            { value: '1', label: '1.0' },
            { value: '1.2', label: '1.2' },
            { value: '1.4', label: '1.4' },
            { value: '1.6', label: '1.6' },
            { value: '1.8', label: '1.8' },
            { value: '2', label: '2.0' },
            { value: '2.5', label: '2.5' },
            { value: '3', label: '3.0' }
          ], onChange: (value) => this.setLineHeight(value) }
        ]
      },
      {
        title: 'Advanced',
        buttons: [
          { id: 'text-transform', type: 'select', name: 'text-transform', options: [
            { value: '', label: 'Text Transform' },
            { value: 'uppercase', label: 'UPPERCASE' },
            { value: 'lowercase', label: 'lowercase' },
            { value: 'capitalize', label: 'Capitalize' },
            { value: 'none', label: 'Normal' }
          ], onChange: (value) => this.setTextTransform(value) },
          { id: 'letter-spacing', type: 'select', name: 'letter-spacing', options: [
            { value: '', label: 'Letter Spacing' },
            { value: 'normal', label: 'Normal' },
            { value: '1px', label: 'Tight' },
            { value: '2px', label: 'Normal+' },
            { value: '3px', label: 'Wide' },
            { value: '5px', label: 'Very Wide' }
          ], onChange: (value) => this.setLetterSpacing(value) },
          { id: 'word-spacing', type: 'select', name: 'word-spacing', options: [
            { value: '', label: 'Word Spacing' },
            { value: 'normal', label: 'Normal' },
            { value: '2px', label: 'Tight' },
            { value: '5px', label: 'Normal+' },
            { value: '8px', label: 'Wide' },
            { value: '12px', label: 'Very Wide' }
          ], onChange: (value) => this.setWordSpacing(value) },
          { id: 'text-shadow', symbol: '☁', title: 'Text Shadow', onClick: () => this.showTextShadowDialog() },
          { id: 'drop-cap', symbol: 'Ⓐ', title: 'Drop Cap', onClick: () => this.toggleDropCap() }
        ]
      },
      {
        title: 'Color',
        buttons: [
          { id: 'forecolor', type: 'color', name: 'forecolor', title: 'Text Color', onChange: (value) => this.formatText('foreColor', value) },
          { id: 'backcolor', type: 'color', name: 'backcolor', title: 'Background Color', onChange: (value) => this.formatText('hiliteColor', value) }
        ]
      },
      {
        title: 'Align',
        buttons: [
          { id: 'justifyLeft', symbol: '⫷', title: 'Align Left', onClick: () => this.formatText('justifyLeft') },
          { id: 'justifyCenter', symbol: '⫸', title: 'Align Center', onClick: () => this.formatText('justifyCenter') },
          { id: 'justifyRight', symbol: '⫹', title: 'Align Right', onClick: () => this.formatText('justifyRight') },
          { id: 'justifyFull', symbol: '⫺', title: 'Justify', onClick: () => this.formatText('justifyFull') }
        ]
      },
      {
        title: 'Insert',
        buttons: [
          { id: 'link', symbol: '🔗', title: 'Insert Link', onClick: () => this.createLink() },
          { id: 'image', symbol: '🖼️', title: 'Insert Image', onClick: () => this.insertImage() },
          { id: 'table', symbol: '📊', title: 'Insert Table', onClick: () => this.insertTable() },
          { id: 'blockquote', symbol: '💬', title: 'Blockquote', onClick: () => this.formatText('formatBlock', 'blockquote') },
          { id: 'unordered-list', symbol: '•', title: 'Unordered List', onClick: () => this.formatText('insertUnorderedList') },
          { id: 'ordered-list', symbol: '1.', title: 'Ordered List', onClick: () => this.formatText('insertOrderedList') },
          { id: 'list-styles', type: 'select', name: 'list-styles', options: [
            { value: 'disc', label: '• Disc' },
            { value: 'circle', label: '○ Circle' },
            { value: 'square', label: '■ Square' },
            { value: 'decimal', label: '1. Decimal' },
            { value: 'lower-alpha', label: 'a. Lower Alpha' },
            { value: 'upper-alpha', label: 'A. Upper Alpha' },
            { value: 'lower-roman', label: 'i. Lower Roman' },
            { value: 'upper-roman', label: 'I. Upper Roman' }
          ], onChange: (value) => this.setListStyle(value) },
          { id: 'special-char', symbol: '⚡', title: 'Special Characters', onClick: () => this.showSpecialCharDialog() },
          { id: 'datetime', symbol: '📅', title: 'Date & Time', onClick: () => this.showDateTimeDialog() }
        ]
      },
      {
        title: 'Tools',
        buttons: [
          { id: 'spellcheck', symbol: '✅', title: 'Toggle Spell Check', onClick: () => this.toggleSpellCheck() },
          { id: 'analytics', symbol: '📊', title: 'Document Analytics', onClick: () => this.showAnalyticsPanel() },
          { id: 'preview', symbol: '👁️', title: 'Preview', onClick: () => this.togglePreview() },
          { id: 'codeview', symbol: '💻', title: 'Code View', onClick: () => this.toggleCodeView() }
        ]
      }
    ];
  }

  createButtonGroup(title, buttons) {
    const group = document.createElement('div');
    group.className = 'button-group';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', title);
    
    buttons.forEach(buttonConfig => {
      let element;
      if (buttonConfig.type === 'select') {
        element = this.createSelect(buttonConfig.id, buttonConfig.options, buttonConfig.onChange);
      } else if (buttonConfig.type === 'color') {
        element = this.createColorPicker(buttonConfig.id, buttonConfig.title, buttonConfig.onChange);
      } else {
        element = this.createButton(
          buttonConfig.id, 
          buttonConfig.symbol, 
          buttonConfig.title, 
          buttonConfig.onClick
        );
      }
      group.appendChild(element);
    });
    
    this.toolbar.appendChild(group);
  }

  createButton(id, symbol, title, onClick) {
    const btn = document.createElement('button');
    btn.id = id;
    btn.textContent = symbol;
    btn.title = title;
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', title);
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        onClick();
        this.recordHistory();
      } catch (error) {
        console.error('Button action failed:', error);
        this.showNotification('Action failed', 'error');
      }
    });

    return btn;
  }

  createSelect(name, options, onChange) {
    const select = document.createElement('select');
    select.className = 'editor-select';
    select.id = name;
    select.setAttribute('aria-label', name);
    
    // Get the appropriate default label based on the select name
    const getDefaultLabel = (name) => {
      switch (name) {
        case 'font-family': return 'Font';
        case 'font-size': return 'Size';
        case 'heading': return 'Heading';
        case 'line-height': return 'Line Height';
        case 'list-styles': return 'List Styles';
        case 'text-transform': return 'Text Transform';
        case 'letter-spacing': return 'Letter Spacing';
        case 'word-spacing': return 'Word Spacing';
        default: return 'Select';
      }
    };
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = getDefaultLabel(name);
    select.appendChild(defaultOption);
    
    // Add options - handle both old format (key-value) and new format (array of objects)
    if (Array.isArray(options)) {
      // New format: array of objects with value and label properties
      options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        select.appendChild(optionElement);
      });
    } else {
      // Old format: object with key-value pairs
      for (const [value, label] of Object.entries(options)) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
      }
    }
    
    select.addEventListener('change', () => {
      if (select.value) {
        onChange(select.value);
        this.recordHistory();
      }
      // Reset to default option
      select.selectedIndex = 0;
    });
    
    return select;
  }

  createColorPicker(name, title, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'color-picker';
    
    const input = document.createElement('input');
    input.type = 'color';
    input.id = name;
    input.title = title;
    input.value = '#000000';
    input.setAttribute('aria-label', title);
    
    input.addEventListener('change', () => {
      onChange(input.value);
      this.recordHistory();
    });
    
    wrapper.appendChild(input);
    return wrapper;
  }

  createEditableArea() {
    this.editable = document.createElement('div');
    this.editable.className = 'editor-content';
    this.editable.contentEditable = true;
    this.editable.setAttribute('role', 'textbox');
    this.editable.setAttribute('aria-label', 'Editor content area');
    this.editable.setAttribute('aria-multiline', 'true');
    this.editable.spellcheck = true; // Enable spell check by default
    
    // Set initial content
    this.editable.innerHTML = '<p>Start typing here...</p>';
    
    // Create footer for word/line count
    this.footer = document.createElement('div');
    this.footer.className = 'editor-footer';
    this.footer.style.cssText = `
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-top: none;
      border-radius: 0 0 6px 6px;
      padding: 8px 16px;
      font-size: 12px;
      color: #6c757d;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 20px;
    `;
    
    // Create word count element
    this.wordCountElement = document.createElement('span');
    this.wordCountElement.className = 'word-count';
    this.wordCountElement.textContent = 'Words: 0';
    
    // Create line count element
    this.lineCountElement = document.createElement('span');
    this.lineCountElement.className = 'line-count';
    this.lineCountElement.textContent = 'Lines: 0';
    
    this.footer.appendChild(this.wordCountElement);
    this.footer.appendChild(this.lineCountElement);
  }

  assembleEditor() {
    this.container.appendChild(this.toolbar);
    this.container.appendChild(this.editable);
    this.container.appendChild(this.footer);
    
    // Set initial spell check button state
    const spellcheckBtn = document.getElementById('spellcheck');
    if (spellcheckBtn) {
      spellcheckBtn.classList.add('active');
      spellcheckBtn.title = 'Disable Spell Check';
    }
    
    // Update footer with initial counts
    this.updateFooter();
  }

  updateFooter() {
    const content = this.getText();
    
    // More accurate word counting algorithm
    const wordCount = this.countWords(content);
    const lineCount = this.countLines(content);
    
    this.wordCountElement.textContent = `Words: ${wordCount.toLocaleString()}`;
    this.lineCountElement.textContent = `Lines: ${lineCount.toLocaleString()}`;
  }

  getText() {
    // Get the raw HTML content
    const html = this.editable.innerHTML;
    
    // Create a temporary div to work with the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Function to recursively extract text from nodes
    const extractText = (node) => {
      let text = '';
      
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Handle block elements that create line breaks
        if (['P', 'DIV', 'BR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.tagName)) {
          text += '\n';
        }
        
        // Recursively process child nodes
        for (let child of node.childNodes) {
          text += extractText(child);
        }
        
        // Add line break after block elements (except if it's the last child)
        if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.tagName)) {
          text += '\n';
        }
      }
      
      return text;
    };
    
    let text = extractText(tempDiv);
    
    // Clean up the text
    text = text.replace(/\n\s*\n/g, '\n'); // Remove multiple consecutive line breaks
    text = text.replace(/^\n+|\n+$/g, ''); // Remove leading/trailing line breaks
    
    return text;
  }

  countWords(text) {
    if (!text || !text.trim()) return 0;
    
    // Split by any whitespace and filter out empty strings
    const words = text.split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }

  countLines(text) {
    if (!text || !text.trim()) return 0;
    
    // Split by line breaks and filter out empty lines
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    return lines.length;
  }

  setupEventListeners() {
    // Focus management
    this.editable.addEventListener('focus', () => {
      this.container.classList.add('focused');
    });
    
    this.editable.addEventListener('blur', () => {
      this.container.classList.remove('focused');
    });
    
    // Content change events
    this.editable.addEventListener('input', () => {
      this.recordHistory();
      this.updateFooter(); // Update footer counts
      this.autoSave();
    });
    
    this.editable.addEventListener('paste', (e) => {
      setTimeout(() => {
        this.recordHistory();
        this.updateFooter(); // Update footer counts
      }, 0);
    });
    
    // Keyboard events
    this.editable.addEventListener('keydown', (e) => {
      // Handle Enter key for new paragraphs
      if (e.key === 'Enter' && !e.shiftKey) {
        setTimeout(() => {
          this.updateFooter(); // Update footer counts
        }, 0);
      }
    });
    
    // Click events for toolbar buttons
    this.toolbar.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        e.preventDefault();
        const button = e.target;
        const command = button.getAttribute('data-command');
        const value = button.getAttribute('data-value');
        
        if (command) {
          this.formatText(command, value);
          this.recordHistory();
          this.updateFooter(); // Update footer counts
        }
      }
    });
  }

  setupKeyboardShortcuts() {
    this.editable.addEventListener('keydown', (e) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      
      if (isCtrl) {
        switch(e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            this.formatText('bold');
            break;
          case 'i':
            e.preventDefault();
            this.formatText('italic');
            break;
          case 'u':
            e.preventDefault();
            this.formatText('underline');
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              this.redo();
            } else {
              this.undo();
            }
            break;
          case 'y':
            e.preventDefault();
            this.redo();
            break;
          case 's':
            if (e.shiftKey) {
              e.preventDefault();
              this.formatText('strikeThrough');
            }
            break;
          case ',':
            e.preventDefault();
            this.formatText('subscript');
            break;
          case '.':
            e.preventDefault();
            this.formatText('superscript');
            break;
          case 'x':
            e.preventDefault();
            this.formatText('cut');
            break;
          case 'c':
            e.preventDefault();
            this.formatText('copy');
            break;
          case 'v':
            e.preventDefault();
            this.pasteContent();
            break;
          case 'f':
            e.preventDefault();
            this.showFindDialog();
            break;
          case 'h':
            e.preventDefault();
            this.showReplaceDialog();
            break;
        }
      }
    });
  }

  setupAutoSave() {
    if (this.config.autoSaveDelay > 0) {
      this.editable.addEventListener('input', () => {
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
          this.saveContent();
        }, this.config.autoSaveDelay);
      });
    }
  }

  // Performance optimization: Debounce function
  debounce(func, wait) {
    return (...args) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Enhanced formatting with error handling
  formatText(command, value = null) {
    try {
      const success = document.execCommand(command, false, value);
      if (!success) {
        console.warn(`Command '${command}' failed to execute`);
      }
      this.editable.focus();
      return success;
    } catch (error) {
      console.error('Format command failed:', error);
      this.showNotification('Formatting failed', 'error');
      return false;
    }
  }

  // Secure content methods
  getContent() {
    return this.sanitizeHTML(this.editable.innerHTML);
  }

  setContent(html) {
    try {
      // Check if the content looks like HTML but is being treated as text
      if (html && typeof html === 'string' && html.includes('<') && html.includes('>')) {
        // If the content contains HTML tags but the editor is showing them as text,
        // it means the content was corrupted during code view toggle
        const sanitized = this.sanitizeHTML(html);
        this.editable.innerHTML = sanitized;
        
        // Ensure we're not in code view mode
        if (this.state.isCodeView) {
          this.state.isCodeView = false;
          this.editable.classList.remove('code-view');
          const codeBtn = document.getElementById('codeview');
          if (codeBtn) {
            codeBtn.classList.remove('active');
            codeBtn.title = 'Code View';
          }
        }
      } else {
        // Normal content setting
        const sanitized = this.sanitizeHTML(html);
        this.editable.innerHTML = sanitized;
      }
      
      // Ensure proper structure after setting content
      this.ensureProperStructure();
      
      // Update footer after content change
      this.updateFooter();
    } catch (error) {
      console.error('Failed to set content:', error);
      this.showNotification('Failed to set content', 'error');
    }
  }

  // HTML sanitization for security
  sanitizeHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Remove potentially dangerous elements and attributes
    const dangerousTags = ['script', 'object', 'embed', 'applet', 'form'];
    const dangerousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'javascript:'];
    
    dangerousTags.forEach(tag => {
      const elements = div.querySelectorAll(tag);
      elements.forEach(el => el.remove());
    });
    
    // Remove dangerous attributes, but preserve code block functionality
    const allElements = div.querySelectorAll('*');
    allElements.forEach(el => {
      dangerousAttrs.forEach(attr => {
        // Don't remove onclick from code copy buttons
        if (attr === 'onclick' && el.classList.contains('code-copy-btn')) {
          return;
        }
        el.removeAttribute(attr);
      });
    });
    
    return div.innerHTML;
  }

  // Enhanced link creation with validation
  createLink() {
    try {
      const url = this.showPrompt('Enter URL:', 'https://');
      if (url && this.isValidUrl(url)) {
        this.formatText('createLink', url);
        this.showNotification('Link created successfully', 'success');
      } else if (url) {
        this.showNotification('Invalid URL format', 'error');
      }
    } catch (error) {
      this.showNotification('Failed to create link', 'error');
    }
  }

  // Enhanced image insertion with validation
  insertImage() {
    try {
      const url = this.showPrompt('Enter image URL:', 'https://');
      if (url && this.isValidUrl(url)) {
        this.formatText('insertImage', url);
        this.showNotification('Image inserted successfully', 'success');
      } else if (url) {
        this.showNotification('Invalid URL format', 'error');
      }
    } catch (error) {
      this.showNotification('Failed to insert image', 'error');
    }
  }

  // Enhanced table creation
  insertTable() {
    try {
      const rows = parseInt(this.showPrompt('Number of rows:', '3')) || 3;
      const cols = parseInt(this.showPrompt('Number of columns:', '3')) || 3;
      
      if (rows > 0 && cols > 0 && rows <= 20 && cols <= 20) {
        const table = this.createTableHTML(rows, cols);
        this.formatText('insertHTML', table);
        this.showNotification('Table inserted successfully', 'success');
      } else {
        this.showNotification('Invalid table dimensions', 'error');
      }
    } catch (error) {
      this.showNotification('Failed to insert table', 'error');
    }
  }

  createTableHTML(rows, cols) {
    let table = '<table border="1" style="border-collapse: collapse; width: 100%;">';
    for (let i = 0; i < rows; i++) {
      table += '<tr>';
      for (let j = 0; j < cols; j++) {
        table += '<td style="padding: 8px; border: 1px solid #ddd;">Cell</td>';
      }
      table += '</tr>';
    }
    table += '</table>';
    return table;
  }

  // Enhanced preview toggle
  togglePreview() {
    try {
      this.state.isPreview = !this.state.isPreview;
      this.editable.contentEditable = !this.state.isPreview;
      
      const previewBtn = document.getElementById('preview');
      if (previewBtn) {
        if (this.state.isPreview) {
          previewBtn.classList.add('active');
          previewBtn.title = 'Exit Preview';
          this.container.classList.add('preview-mode');
          this.showNotification('Preview mode enabled', 'info');
        } else {
          previewBtn.classList.remove('active');
          previewBtn.title = 'Preview';
          this.container.classList.remove('preview-mode');
          this.showNotification('Preview mode disabled', 'info');
        }
      } else {
        console.error('Preview button not found');
        this.showNotification('Preview button not found', 'error');
      }
    } catch (error) {
      console.error('Preview toggle failed:', error);
      this.showNotification('Preview toggle failed', 'error');
    }
  }

  // Enhanced code view toggle
  toggleCodeView() {
    try {
      this.state.isCodeView = !this.state.isCodeView;
      const codeBtn = document.getElementById('codeview');
      
      if (this.state.isCodeView) {
        // Store the current HTML content before switching to code view
        this.state.lastHTML = this.editable.innerHTML;
        this.editable.textContent = this.editable.innerHTML;
        this.editable.classList.add('code-view');
        codeBtn.classList.add('active');
        codeBtn.title = 'Exit Code View';
        this.showNotification('Code view enabled - Edit HTML directly', 'info');
        
        // Add input listener for code view changes
        this.editable.addEventListener('input', this.handleCodeViewInput.bind(this), { once: false });
      } else {
        // Remove the code view input listener
        this.editable.removeEventListener('input', this.handleCodeViewInput.bind(this));
        
        // When exiting code view, use the current text content as the new HTML
        // This allows users to edit the HTML directly in code view
        const newHTML = this.editable.textContent;
        
        // Try to parse the new HTML content
        try {
          // Create a temporary div to validate the HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = newHTML;
          
          // Always use the new HTML content from code view
          this.editable.innerHTML = newHTML;
          this.state.lastHTML = newHTML; // Update the stored HTML
          
          // Ensure proper structure after setting content
          this.ensureProperStructure();
          
          this.showNotification('HTML updated successfully', 'success');
        } catch (error) {
          // If parsing fails, restore the original HTML
          this.editable.innerHTML = this.state.lastHTML || '';
          this.showNotification('Invalid HTML - restored original content', 'warning');
        }
        
        this.editable.classList.remove('code-view');
        codeBtn.classList.remove('active');
        codeBtn.title = 'Code View';
        
        // Update footer after content change
        this.updateFooter();
      }
    } catch (error) {
      this.showNotification('Failed to toggle code view', 'error');
    }
  }
  
  // Handle input changes in code view mode
  handleCodeViewInput() {
    if (this.state.isCodeView) {
      // Update the lastHTML state with the current text content
      this.state.lastHTML = this.editable.textContent;
    }
  }

  // Optimized history management
  recordHistory() {
    const currentContent = this.getContent();
    
    // Only record if content actually changed
    if (this.state.history.length === 0 || 
        this.state.history[this.state.historyIndex] !== currentContent) {
      
      // Remove any future history if we're not at the end
      this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
      this.state.history.push(currentContent);
      this.state.historyIndex = this.state.history.length - 1;
      
      // Limit history to prevent memory issues
      if (this.state.history.length > this.config.historyLimit) {
        this.state.history.shift();
        this.state.historyIndex--;
      }
    }
  }

  undo() {
    try {
      if (this.state.historyIndex > 0) {
        this.state.historyIndex--;
        this.setContent(this.state.history[this.state.historyIndex]);
        this.showNotification('Undo completed', 'info');
      } else {
        this.showNotification('Nothing to undo', 'info');
      }
    } catch (error) {
      this.showNotification('Failed to undo', 'error');
    }
  }

  redo() {
    try {
      if (this.state.historyIndex < this.state.history.length - 1) {
        this.state.historyIndex++;
        this.setContent(this.state.history[this.state.historyIndex]);
        this.showNotification('Redo completed', 'info');
      } else {
        this.showNotification('Nothing to redo', 'info');
      }
    } catch (error) {
      this.showNotification('Failed to redo', 'error');
    }
  }

  // Utility methods
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  showPrompt(message, defaultValue = '') {
    try {
      return prompt(message, defaultValue);
    } catch (error) {
      this.showNotification('Failed to show prompt dialog', 'error');
      return null;
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `editor-notification ${type}`;
    notification.textContent = message;
    
    // Add to container
    this.container.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  saveContent() {
    try {
      const content = this.getContent();
      // Here you would typically save to localStorage or send to server
      localStorage.setItem('wysiwyg-content', content);
      this.state.lastSaved = new Date();
      this.showNotification('Content saved', 'success');
    } catch (error) {
      console.error('Save failed:', error);
      this.showNotification('Save failed', 'error');
    }
  }

  loadContent() {
    try {
      const content = localStorage.getItem('wysiwyg-content');
      if (content) {
        this.setContent(content);
        this.recordHistory();
        this.showNotification('Content loaded', 'success');
      }
    } catch (error) {
      console.error('Load failed:', error);
      this.showNotification('Load failed', 'error');
    }
  }

  // Public API methods
  getHTML() {
    return this.getContent();
  }

  setHTML(html) {
    this.setContent(html);
    this.recordHistory();
  }

  destroy() {
    // Cleanup
    clearTimeout(this.debounceTimer);
    clearTimeout(this.autoSaveTimer);
    
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Remove event listeners
    this.editable.removeEventListener('input', this.debounce);
    this.editable.removeEventListener('keydown', this.setupKeyboardShortcuts);
    
    // Clear container
    this.container.innerHTML = '';
  }

  setLineHeight(value) {
    try {
      const selection = window.getSelection();
      if (!selection.rangeCount) {
        this.showNotification('Please select text to apply line height', 'warning');
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (selectedText) {
        // Apply line-height to selected text
        const span = document.createElement('span');
        span.style.lineHeight = value;
        span.textContent = selectedText;
        
        range.deleteContents();
        range.insertNode(span);
        this.showNotification('Line height applied to selection', 'success');
      } else {
        // Apply line-height to current paragraph
        const paragraph = this.getCurrentParagraph();
        if (paragraph) {
          paragraph.style.lineHeight = value;
          this.showNotification('Line height applied to paragraph', 'success');
        } else {
          this.showNotification('No paragraph found to apply line height', 'warning');
          return;
        }
      }
      
      this.editable.focus();
      this.recordHistory();
    } catch (error) {
      this.showNotification('Failed to apply line height', 'error');
    }
  }

  getCurrentParagraph() {
    try {
      const selection = window.getSelection();
      if (!selection.rangeCount) return null;
      
      let node = selection.anchorNode;
      while (node && node !== this.editable) {
        if (node.nodeName === 'P' || node.nodeName === 'DIV') {
          return node;
        }
        node = node.parentNode;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  showFindDialog() {
    try {
      const searchText = prompt('Find:', '');
      if (searchText && searchText.trim()) {
        this.findText(searchText);
      }
    } catch (error) {
      this.showNotification('Failed to open find dialog', 'error');
    }
  }

  showReplaceDialog() {
    try {
      const findText = prompt('Find:', '');
      if (findText !== null && findText.trim()) {
        const replaceText = prompt('Replace with:', '');
        if (replaceText !== null) {
          this.replaceText(findText, replaceText);
        }
      }
    } catch (error) {
      this.showNotification('Failed to open replace dialog', 'error');
    }
  }

  findText(searchText) {
    try {
      // Clear previous highlights
      const highlights = this.editable.querySelectorAll('.highlight');
      highlights.forEach(el => {
        const parent = el.parentNode;
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      });
      
      const content = this.editable.innerHTML;
      const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = content.match(regex);
      
      if (matches && matches.length > 0) {
        this.editable.innerHTML = content.replace(regex, match => `<span class="highlight">${match}</span>`);
        this.showNotification(`Found ${matches.length} match(es)`, 'success');
      } else {
        this.showNotification('No matches found', 'info');
      }
    } catch (error) {
      this.showNotification('Failed to search text', 'error');
    }
  }

  replaceText(findText, replaceText) {
    try {
      // Clear previous highlights
      const highlights = this.editable.querySelectorAll('.highlight');
      highlights.forEach(el => {
        const parent = el.parentNode;
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      });
      
      const content = this.editable.innerHTML;
      const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = content.match(regex);
      
      if (matches && matches.length > 0) {
        this.editable.innerHTML = content.replace(regex, replaceText);
        this.recordHistory();
        this.showNotification(`Replaced ${matches.length} match(es)`, 'success');
      } else {
        this.showNotification('No matches found', 'info');
      }
    } catch (error) {
      this.showNotification('Failed to replace text', 'error');
    }
  }

  pasteContent() {
    try {
      // Focus the editor first
      this.editable.focus();
      
      // Try to use clipboard API first, fallback to execCommand
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
          document.execCommand('insertText', false, text);
          this.recordHistory();
          this.showNotification('Content pasted successfully', 'success');
        }).catch(() => {
          // Fallback to execCommand paste
          document.execCommand('paste');
          this.recordHistory();
          this.showNotification('Content pasted successfully', 'success');
        });
      } else {
        // Fallback for older browsers
        document.execCommand('paste');
        this.recordHistory();
        this.showNotification('Content pasted successfully', 'success');
      }
    } catch (error) {
      this.showNotification('Failed to paste content', 'error');
    }
  }

  toggleSpellCheck() {
    try {
      this.editable.spellcheck = !this.editable.spellcheck;
      const spellcheckBtn = document.getElementById('spellcheck');
      
      if (this.editable.spellcheck) {
        spellcheckBtn.classList.add('active');
        spellcheckBtn.title = 'Disable Spell Check';
        this.showNotification('Spell check enabled', 'info');
      } else {
        spellcheckBtn.classList.remove('active');
        spellcheckBtn.title = 'Enable Spell Check';
        this.showNotification('Spell check disabled', 'info');
      }
    } catch (error) {
      this.showNotification('Failed to toggle spell check', 'error');
    }
  }

  showSpecialCharDialog() {
    const specialChars = [
      // Trademarks and Copyright
      { char: '©', name: 'Copyright' },
      { char: '®', name: 'Registered Trademark' },
      { char: '™', name: 'Trademark' },
      { char: '℠', name: 'Service Mark' },
      
      // Currency
      { char: '€', name: 'Euro' },
      { char: '£', name: 'Pound Sterling' },
      { char: '¥', name: 'Yen' },
      { char: '$', name: 'Dollar' },
      { char: '¢', name: 'Cent' },
      
      // Legal and Reference
      { char: '§', name: 'Section' },
      { char: '¶', name: 'Paragraph' },
      { char: '†', name: 'Dagger' },
      { char: '‡', name: 'Double Dagger' },
      
      // Punctuation and Symbols
      { char: '•', name: 'Bullet' },
      { char: '…', name: 'Ellipsis' },
      { char: '‰', name: 'Per Mille' },
      { char: '′', name: 'Prime' },
      { char: '″', name: 'Double Prime' },
      
      // Quotes and Brackets
      { char: '‹', name: 'Left Single Guillemet' },
      { char: '›', name: 'Right Single Guillemet' },
      { char: '«', name: 'Left Double Guillemet' },
      { char: '»', name: 'Right Double Guillemet' },
      { char: '\u201C', name: 'Left Double Quote' },
      { char: '\u201D', name: 'Right Double Quote' },
      { char: '\u2018', name: 'Left Single Quote' },
      { char: '\u2019', name: 'Right Single Quote' },
      
      // Dashes and Hyphens
      { char: '—', name: 'Em Dash' },
      { char: '–', name: 'En Dash' },
      { char: '−', name: 'Minus Sign' },
      
      // Mathematical
      { char: '±', name: 'Plus-Minus' },
      { char: '×', name: 'Multiplication' },
      { char: '÷', name: 'Division' },
      { char: '≤', name: 'Less Than or Equal' },
      { char: '≥', name: 'Greater Than or Equal' },
      { char: '≠', name: 'Not Equal' },
      { char: '≈', name: 'Approximately Equal' },
      
      // Arrows
      { char: '→', name: 'Right Arrow' },
      { char: '←', name: 'Left Arrow' },
      { char: '↑', name: 'Up Arrow' },
      { char: '↓', name: 'Down Arrow' },
      { char: '↔', name: 'Left-Right Arrow' },
      { char: '↕', name: 'Up-Down Arrow' }
    ];
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'char-picker-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Create picker container
    const picker = document.createElement('div');
    picker.className = 'char-picker';
    picker.style.cssText = `
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      padding: 20px;
      max-width: 500px;
      max-height: 400px;
      overflow-y: auto;
      position: relative;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Special Characters';
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      color: #333;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Create character grid
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 8px;
    `;
    
    specialChars.forEach(item => {
      const charBtn = document.createElement('button');
      charBtn.textContent = item.char;
      charBtn.title = item.name;
      charBtn.style.cssText = `
        width: 40px;
        height: 40px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      `;
      
      charBtn.addEventListener('mouseenter', () => {
        charBtn.style.background = '#f0f0f0';
        charBtn.style.borderColor = '#007bff';
      });
      
      charBtn.addEventListener('mouseleave', () => {
        charBtn.style.background = 'white';
        charBtn.style.borderColor = '#ddd';
      });
      
      charBtn.addEventListener('click', () => {
        this.formatText('insertText', item.char);
        this.recordHistory();
        document.body.removeChild(overlay);
      });
      
      grid.appendChild(charBtn);
    });
    
    // Assemble picker
    picker.appendChild(header);
    picker.appendChild(grid);
    overlay.appendChild(picker);
    
    // Add to page
    document.body.appendChild(overlay);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
    
    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  showDateTimeDialog() {
    const now = new Date();
    
    const dateTimeFormats = [
      { 
        label: 'Full Date & Time', 
        value: now.toLocaleString(),
        example: '12/25/2023, 2:30:45 PM'
      },
      { 
        label: 'Date Only', 
        value: now.toLocaleDateString(),
        example: '12/25/2023'
      },
      { 
        label: 'Time Only', 
        value: now.toLocaleTimeString(),
        example: '2:30:45 PM'
      },
      { 
        label: 'Short Date', 
        value: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        example: 'Dec 25, 2023'
      },
      { 
        label: 'Long Date', 
        value: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        example: 'Monday, December 25, 2023'
      },
      { 
        label: 'ISO Format', 
        value: now.toISOString().split('T')[0],
        example: '2023-12-25'
      },
      { 
        label: 'Custom Format', 
        value: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        example: '2023-12-25 14:30'
      }
    ];
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'datetime-picker-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Create picker container
    const picker = document.createElement('div');
    picker.className = 'datetime-picker';
    picker.style.cssText = `
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      padding: 20px;
      max-width: 400px;
      max-height: 500px;
      overflow-y: auto;
      position: relative;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Insert Date & Time';
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      color: #333;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Create format options
    const optionsContainer = document.createElement('div');
    optionsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
    
    dateTimeFormats.forEach(format => {
      const optionBtn = document.createElement('button');
      optionBtn.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 12px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s;
        width: 100%;
      `;
      
      const label = document.createElement('div');
      label.textContent = format.label;
      label.style.cssText = `
        font-weight: 500;
        color: #333;
        margin-bottom: 4px;
      `;
      
      const example = document.createElement('div');
      example.textContent = format.example;
      example.style.cssText = `
        font-size: 12px;
        color: #666;
        font-family: monospace;
      `;
      
      optionBtn.appendChild(label);
      optionBtn.appendChild(example);
      
      optionBtn.addEventListener('mouseenter', () => {
        optionBtn.style.background = '#f0f0f0';
        optionBtn.style.borderColor = '#007bff';
      });
      
      optionBtn.addEventListener('mouseleave', () => {
        optionBtn.style.background = 'white';
        optionBtn.style.borderColor = '#ddd';
      });
      
      optionBtn.addEventListener('click', () => {
        this.formatText('insertText', format.value);
        this.recordHistory();
        document.body.removeChild(overlay);
      });
      
      optionsContainer.appendChild(optionBtn);
    });
    
    // Assemble picker
    picker.appendChild(header);
    picker.appendChild(optionsContainer);
    overlay.appendChild(picker);
    
    // Add to page
    document.body.appendChild(overlay);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
    
    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  showAnalyticsPanel() {
    const content = this.getText();
    const htmlContent = this.getContent();
    
    // Calculate various metrics
    const charCount = content.length;
    const charCountNoSpaces = content.replace(/\s/g, '').length;
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const sentenceCount = content.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
    const paragraphCount = htmlContent.split(/<\/p>|<\/div>/).filter(p => p.trim().length > 0).length;
    const lineCount = content.split('\n').filter(line => line.trim().length > 0).length;
    
    // Calculate reading time (average 200 words per minute)
    const readingTimeMinutes = Math.ceil(wordCount / 200);
    const readingTimeSeconds = Math.round((wordCount / 200) * 60);
    
    // Calculate speaking time (average 150 words per minute)
    const speakingTimeMinutes = Math.ceil(wordCount / 150);
    const speakingTimeSeconds = Math.round((wordCount / 150) * 60);
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'analytics-panel-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Create panel container
    const panel = document.createElement('div');
    panel.className = 'analytics-panel';
    panel.style.cssText = `
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      padding: 20px;
      max-width: 500px;
      max-height: 600px;
      overflow-y: auto;
      position: relative;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Document Analytics';
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      color: #333;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Create metrics grid
    const metricsGrid = document.createElement('div');
    metricsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    `;
    
    const metrics = [
      { label: 'Words', value: wordCount, icon: '📝' },
      { label: 'Characters', value: charCount, icon: '🔤' },
      { label: 'Characters (no spaces)', value: charCountNoSpaces, icon: '📄' },
      { label: 'Sentences', value: sentenceCount, icon: '💬' },
      { label: 'Paragraphs', value: paragraphCount, icon: '📋' },
      { label: 'Lines', value: lineCount, icon: '📏' }
    ];
    
    metrics.forEach(metric => {
      const metricCard = document.createElement('div');
      metricCard.style.cssText = `
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        padding: 15px;
        text-align: center;
      `;
      
      const icon = document.createElement('div');
      icon.textContent = metric.icon;
      icon.style.cssText = `
        font-size: 24px;
        margin-bottom: 8px;
      `;
      
      const value = document.createElement('div');
      value.textContent = metric.value.toLocaleString();
      value.style.cssText = `
        font-size: 24px;
        font-weight: bold;
        color: #007bff;
        margin-bottom: 4px;
      `;
      
      const label = document.createElement('div');
      label.textContent = metric.label;
      label.style.cssText = `
        font-size: 12px;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      `;
      
      metricCard.appendChild(icon);
      metricCard.appendChild(value);
      metricCard.appendChild(label);
      metricsGrid.appendChild(metricCard);
    });
    
    // Create time estimates section
    const timeSection = document.createElement('div');
    timeSection.style.cssText = `
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    `;
    
    const timeTitle = document.createElement('h4');
    timeTitle.textContent = 'Time Estimates';
    timeTitle.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 16px;
      color: #333;
    `;
    
    const timeGrid = document.createElement('div');
    timeGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    `;
    
    const timeMetrics = [
      { 
        label: 'Reading Time', 
        value: readingTimeMinutes > 0 ? `${readingTimeMinutes}m ${readingTimeSeconds % 60}s` : 'Less than 1m',
        icon: '👁️',
        description: 'Average reading speed'
      },
      { 
        label: 'Speaking Time', 
        value: speakingTimeMinutes > 0 ? `${speakingTimeMinutes}m ${speakingTimeSeconds % 60}s` : 'Less than 1m',
        icon: '🗣️',
        description: 'Average speaking speed'
      }
    ];
    
    timeMetrics.forEach(metric => {
      const timeCard = document.createElement('div');
      timeCard.style.cssText = `
        background: #e3f2fd;
        border: 1px solid #bbdefb;
        border-radius: 6px;
        padding: 15px;
        text-align: center;
      `;
      
      const icon = document.createElement('div');
      icon.textContent = metric.icon;
      icon.style.cssText = `
        font-size: 20px;
        margin-bottom: 8px;
      `;
      
      const value = document.createElement('div');
      value.textContent = metric.value;
      value.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        color: #1976d2;
        margin-bottom: 4px;
      `;
      
      const label = document.createElement('div');
      label.textContent = metric.label;
      label.style.cssText = `
        font-size: 12px;
        color: #424242;
        margin-bottom: 2px;
      `;
      
      const description = document.createElement('div');
      description.textContent = metric.description;
      description.style.cssText = `
        font-size: 10px;
        color: #757575;
      `;
      
      timeCard.appendChild(icon);
      timeCard.appendChild(value);
      timeCard.appendChild(label);
      timeCard.appendChild(description);
      timeGrid.appendChild(timeCard);
    });
    
    timeSection.appendChild(timeTitle);
    timeSection.appendChild(timeGrid);
    
    // Assemble panel
    panel.appendChild(header);
    panel.appendChild(metricsGrid);
    panel.appendChild(timeSection);
    overlay.appendChild(panel);
    
    // Add to page
    document.body.appendChild(overlay);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
    
    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  // Export and Import Methods
  exportToPDF() {
    try {
      // Check if jsPDF is available
      if (typeof jsPDF === 'undefined') {
        this.showNotification('PDF export requires jsPDF library. Please include jsPDF in your project.', 'error');
        return;
      }

      const content = this.getText();
      const doc = new jsPDF();
      
      // Set font and size
      doc.setFont('helvetica');
      doc.setFontSize(12);
      
      // Split content into lines that fit the page width
      const pageWidth = doc.internal.pageSize.width - 20; // 10px margin on each side
      const lines = doc.splitTextToSize(content, pageWidth);
      
      // Add content to PDF
      doc.text(lines, 10, 20);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `document_${timestamp}.pdf`;
      
      // Save the PDF
      doc.save(filename);
      this.showNotification('PDF exported successfully!', 'success');
    } catch (error) {
      console.error('PDF export failed:', error);
      this.showNotification('PDF export failed. Please try again.', 'error');
    }
  }

  exportToWord() {
    try {
      const content = this.getContent();
      
      // Create Word document HTML structure
      const wordHTML = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Document</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>90</w:Zoom>
              <w:DoNotPromptForConvert/>
              <w:DoNotShowRevisions/>
              <w:DoNotPrintRevisions/>
              <w:DisplayHorizontalDrawingGridEvery>0</w:DisplayHorizontalDrawingGridEvery>
              <w:DisplayVerticalDrawingGridEvery>2</w:DisplayVerticalDrawingGridEvery>
              <w:UseMarginsForDrawingGridOrigin/>
              <w:ValidateAgainstSchemas/>
              <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
              <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
              <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
              <w:Compatibility>
                <w:BreakWrappedTables/>
                <w:SnapToGridInCell/>
                <w:WrapTextWithPunct/>
                <w:UseAsianBreakRules/>
                <w:DontGrowAutofit/>
              </w:Compatibility>
            </w:WordDocument>
          </xml>
          <![endif]-->
        </head>
        <body>
          ${content}
        </body>
        </html>
      `;
      
      // Create blob and download
      const blob = new Blob([wordHTML], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `document_${timestamp}.doc`;
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      this.showNotification('Word document exported successfully!', 'success');
    } catch (error) {
      console.error('Word export failed:', error);
      this.showNotification('Word export failed. Please try again.', 'error');
    }
  }

  exportToMarkdown() {
    try {
      const htmlContent = this.getContent();
      
      // Convert HTML to Markdown
      const markdown = this.htmlToMarkdown(htmlContent);
      
      // Create blob and download
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `document_${timestamp}.md`;
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      this.showNotification('Markdown exported successfully!', 'success');
    } catch (error) {
      console.error('Markdown export failed:', error);
      this.showNotification('Markdown export failed. Please try again.', 'error');
    }
  }

  htmlToMarkdown(html) {
    // Create temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    let markdown = '';
    
    // Process each child node
    for (let node of tempDiv.childNodes) {
      markdown += this.nodeToMarkdown(node);
    }
    
    return markdown.trim();
  }

  nodeToMarkdown(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      const text = node.textContent;
      
      switch (tagName) {
        case 'h1':
          return `# ${text}\n\n`;
        case 'h2':
          return `## ${text}\n\n`;
        case 'h3':
          return `### ${text}\n\n`;
        case 'h4':
          return `#### ${text}\n\n`;
        case 'h5':
          return `##### ${text}\n\n`;
        case 'h6':
          return `###### ${text}\n\n`;
        case 'p':
          return `${text}\n\n`;
        case 'br':
          return '\n';
        case 'strong':
        case 'b':
          return `**${text}**`;
        case 'em':
        case 'i':
          return `*${text}*`;
        case 'u':
          return `__${text}__`;
        case 's':
        case 'strike':
          return `~~${text}~~`;
        case 'blockquote':
          return `> ${text}\n\n`;
        case 'ul':
          return this.listToMarkdown(node, false);
        case 'ol':
          return this.listToMarkdown(node, true);
        case 'li':
          return `- ${text}\n`;
        case 'a':
          const href = node.getAttribute('href');
          return `[${text}](${href})`;
        case 'img':
          const src = node.getAttribute('src');
          const alt = node.getAttribute('alt') || '';
          return `![${alt}](${src})`;
        default:
          return text;
      }
    }
    
    return '';
  }

  listToMarkdown(listNode, ordered) {
    let markdown = '';
    const items = listNode.querySelectorAll('li');
    
    items.forEach((item, index) => {
      if (ordered) {
        markdown += `${index + 1}. ${item.textContent}\n`;
      } else {
        markdown += `- ${item.textContent}\n`;
      }
    });
    
    return markdown + '\n';
  }

  importFile() {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.html,.md,.doc,.docx';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          const fileExtension = file.name.split('.').pop().toLowerCase();
          
          switch (fileExtension) {
            case 'txt':
              this.setContent(`<p>${content.replace(/\n/g, '</p><p>')}</p>`);
              break;
            case 'html':
            case 'htm':
              this.setContent(content);
              break;
            case 'md':
            case 'markdown':
              this.setContent(this.markdownToHtml(content));
              break;
            case 'doc':
            case 'docx':
              this.showNotification('Word document import is not supported in this version.', 'info');
              return;
            default:
              this.showNotification('Unsupported file format.', 'error');
              return;
          }
          
          this.recordHistory();
          this.updateFooter();
          this.showNotification(`File "${file.name}" imported successfully!`, 'success');
        } catch (error) {
          console.error('File import failed:', error);
          this.showNotification('File import failed. Please try again.', 'error');
        }
      };
      
      reader.readAsText(file);
    });
    
    // Trigger file selection
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }

  markdownToHtml(markdown) {
    // Simple Markdown to HTML converter
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Underline
      .replace(/__(.*)__/gim, '<u>$1</u>')
      // Strikethrough
      .replace(/~~(.*)~~/gim, '<s>$1</s>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>');
    
    // Wrap in paragraphs
    html = `<p>${html}</p>`;
    
    return html;
  }

  setListStyle(style) {
    try {
      const selection = window.getSelection();
      if (!selection.rangeCount) {
        this.showNotification('Please select text or place cursor to create list', 'warning');
        return;
      }

      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      // Find the list element (ul or ol)
      let listElement = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;
      while (listElement && !['UL', 'OL'].includes(listElement.tagName)) {
        listElement = listElement.parentElement;
      }
      
      if (listElement) {
        // Apply style to existing list
        if (['disc', 'circle', 'square'].includes(style)) {
          // Unordered list styles
          if (listElement.tagName === 'OL') {
            // Convert ordered list to unordered list
            const ul = document.createElement('ul');
            ul.style.listStyleType = style;
            while (listElement.firstChild) {
              ul.appendChild(listElement.firstChild);
            }
            listElement.parentNode.replaceChild(ul, listElement);
          } else {
            // Apply style to unordered list
            listElement.style.listStyleType = style;
          }
        } else {
          // Ordered list styles
          if (listElement.tagName === 'UL') {
            // Convert unordered list to ordered list
            const ol = document.createElement('ol');
            ol.style.listStyleType = style;
            while (listElement.firstChild) {
              ol.appendChild(listElement.firstChild);
            }
            listElement.parentNode.replaceChild(ol, listElement);
          } else {
            // Apply style to ordered list
            listElement.style.listStyleType = style;
          }
        }
        this.showNotification('List style applied successfully', 'success');
      } else {
        // Create new list if no list is selected
        const selectedText = range.toString();
        if (selectedText) {
          // Create list from selected text
          const lines = selectedText.split('\n').filter(line => line.trim());
          if (lines.length > 0) {
            const listTag = ['disc', 'circle', 'square'].includes(style) ? 'ul' : 'ol';
            const list = document.createElement(listTag);
            list.style.listStyleType = style;
            
            lines.forEach(line => {
              const li = document.createElement('li');
              li.textContent = line.trim();
              list.appendChild(li);
            });
            
            range.deleteContents();
            range.insertNode(list);
            this.showNotification('List created from selection', 'success');
          }
        } else {
          // Create empty list
          const listTag = ['disc', 'circle', 'square'].includes(style) ? 'ul' : 'ol';
          const list = document.createElement(listTag);
          list.style.listStyleType = style;
          
          const li = document.createElement('li');
          li.textContent = 'List item';
          list.appendChild(li);
          
          range.insertNode(list);
          this.showNotification('Empty list created', 'success');
        }
      }
      
      this.recordHistory();
      this.editable.focus();
    } catch (error) {
      this.showNotification('Failed to apply list style', 'error');
    }
  }

  // Advanced Formatting Methods
  toggleTextDirection() {
    try {
      const selection = window.getSelection();
      if (!selection.rangeCount) {
        this.showNotification('Please select text or place cursor to change direction', 'warning');
        return;
      }

      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      // Find the block element
      let blockElement = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;
      while (blockElement && !['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(blockElement.tagName)) {
        blockElement = blockElement.parentElement;
      }
      
      if (blockElement) {
        const currentDir = blockElement.style.direction || 'ltr';
        const newDir = currentDir === 'ltr' ? 'rtl' : 'ltr';
        blockElement.style.direction = newDir;
        
        // Update button state
        const rtlBtn = document.getElementById('rtl');
        if (rtlBtn) {
          if (newDir === 'rtl') {
            rtlBtn.classList.add('active');
            rtlBtn.title = 'Left to Right';
          } else {
            rtlBtn.classList.remove('active');
            rtlBtn.title = 'Right to Left';
          }
        }
        
        this.showNotification(`Text direction changed to ${newDir.toUpperCase()}`, 'success');
        this.recordHistory();
        this.editable.focus();
      } else {
        this.showNotification('No block element found to change direction', 'warning');
      }
    } catch (error) {
      this.showNotification('Failed to change text direction', 'error');
    }
  }

  setTextTransform(value) {
    try {
      if (!value) return;
      
      const selection = window.getSelection();
      if (!selection.rangeCount) {
        this.showNotification('Please select text to apply text transform', 'warning');
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (selectedText) {
        // Apply to selected text
        const span = document.createElement('span');
        span.style.textTransform = value;
        span.textContent = selectedText;
        
        range.deleteContents();
        range.insertNode(span);
        this.showNotification('Text transform applied to selection', 'success');
      } else {
        // Apply to current paragraph
        const paragraph = this.getCurrentParagraph();
        if (paragraph) {
          paragraph.style.textTransform = value;
          this.showNotification('Text transform applied to paragraph', 'success');
        } else {
          this.showNotification('No paragraph found to apply text transform', 'warning');
          return;
        }
      }
      
      this.recordHistory();
      this.editable.focus();
    } catch (error) {
      this.showNotification('Failed to apply text transform', 'error');
    }
  }

  setLetterSpacing(value) {
    try {
      if (!value) return;
      
      const selection = window.getSelection();
      if (!selection.rangeCount) {
        this.showNotification('Please select text to apply letter spacing', 'warning');
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (selectedText) {
        // Apply to selected text
        const span = document.createElement('span');
        span.style.letterSpacing = value;
        span.textContent = selectedText;
        
        range.deleteContents();
        range.insertNode(span);
        this.showNotification('Letter spacing applied to selection', 'success');
      } else {
        // Apply to current paragraph
        const paragraph = this.getCurrentParagraph();
        if (paragraph) {
          paragraph.style.letterSpacing = value;
          this.showNotification('Letter spacing applied to paragraph', 'success');
        } else {
          this.showNotification('No paragraph found to apply letter spacing', 'warning');
          return;
        }
      }
      
      this.recordHistory();
      this.editable.focus();
    } catch (error) {
      this.showNotification('Failed to apply letter spacing', 'error');
    }
  }

  setWordSpacing(value) {
    try {
      if (!value) return;
      
      const selection = window.getSelection();
      if (!selection.rangeCount) {
        this.showNotification('Please select text to apply word spacing', 'warning');
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (selectedText) {
        // Apply to selected text
        const span = document.createElement('span');
        span.style.wordSpacing = value;
        span.textContent = selectedText;
        
        range.deleteContents();
        range.insertNode(span);
        this.showNotification('Word spacing applied to selection', 'success');
      } else {
        // Apply to current paragraph
        const paragraph = this.getCurrentParagraph();
        if (paragraph) {
          paragraph.style.wordSpacing = value;
          this.showNotification('Word spacing applied to paragraph', 'success');
        } else {
          this.showNotification('No paragraph found to apply word spacing', 'warning');
          return;
        }
      }
      
      this.recordHistory();
      this.editable.focus();
    } catch (error) {
      this.showNotification('Failed to apply word spacing', 'error');
    }
  }

  showTextShadowDialog() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'text-shadow-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Create dialog container
    const dialog = document.createElement('div');
    dialog.className = 'text-shadow-dialog';
    dialog.style.cssText = `
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      padding: 20px;
      max-width: 400px;
      width: 100%;
      position: relative;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Text Shadow';
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      color: #333;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Create form
    const form = document.createElement('div');
    form.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 15px;
    `;
    
    // Horizontal offset
    const hOffsetGroup = document.createElement('div');
    hOffsetGroup.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 5px;
    `;
    
    const hOffsetLabel = document.createElement('label');
    hOffsetLabel.textContent = 'Horizontal Offset (px):';
    hOffsetLabel.style.cssText = `
      font-weight: 500;
      color: #333;
    `;
    
    const hOffsetInput = document.createElement('input');
    hOffsetInput.type = 'range';
    hOffsetInput.min = '-20';
    hOffsetInput.max = '20';
    hOffsetInput.value = '2';
    hOffsetInput.style.cssText = `
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: #ddd;
      outline: none;
    `;
    
    const hOffsetValue = document.createElement('span');
    hOffsetValue.textContent = '2px';
    hOffsetValue.style.cssText = `
      font-size: 12px;
      color: #666;
      text-align: center;
    `;
    
    hOffsetInput.addEventListener('input', () => {
      hOffsetValue.textContent = hOffsetInput.value + 'px';
      updatePreview();
    });
    
    hOffsetGroup.appendChild(hOffsetLabel);
    hOffsetGroup.appendChild(hOffsetInput);
    hOffsetGroup.appendChild(hOffsetValue);
    
    // Vertical offset
    const vOffsetGroup = document.createElement('div');
    vOffsetGroup.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 5px;
    `;
    
    const vOffsetLabel = document.createElement('label');
    vOffsetLabel.textContent = 'Vertical Offset (px):';
    vOffsetLabel.style.cssText = `
      font-weight: 500;
      color: #333;
    `;
    
    const vOffsetInput = document.createElement('input');
    vOffsetInput.type = 'range';
    vOffsetInput.min = '-20';
    vOffsetInput.max = '20';
    vOffsetInput.value = '2';
    vOffsetInput.style.cssText = `
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: #ddd;
      outline: none;
    `;
    
    const vOffsetValue = document.createElement('span');
    vOffsetValue.textContent = '2px';
    vOffsetValue.style.cssText = `
      font-size: 12px;
      color: #666;
      text-align: center;
    `;
    
    vOffsetInput.addEventListener('input', () => {
      vOffsetValue.textContent = vOffsetInput.value + 'px';
      updatePreview();
    });
    
    vOffsetGroup.appendChild(vOffsetLabel);
    vOffsetGroup.appendChild(vOffsetInput);
    vOffsetGroup.appendChild(vOffsetValue);
    
    // Blur radius
    const blurGroup = document.createElement('div');
    blurGroup.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 5px;
    `;
    
    const blurLabel = document.createElement('label');
    blurLabel.textContent = 'Blur Radius (px):';
    blurLabel.style.cssText = `
      font-weight: 500;
      color: #333;
    `;
    
    const blurInput = document.createElement('input');
    blurInput.type = 'range';
    blurInput.min = '0';
    blurInput.max = '20';
    blurInput.value = '3';
    blurInput.style.cssText = `
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: #ddd;
      outline: none;
    `;
    
    const blurValue = document.createElement('span');
    blurValue.textContent = '3px';
    blurValue.style.cssText = `
      font-size: 12px;
      color: #666;
      text-align: center;
    `;
    
    blurInput.addEventListener('input', () => {
      blurValue.textContent = blurInput.value + 'px';
      updatePreview();
    });
    
    blurGroup.appendChild(blurLabel);
    blurGroup.appendChild(blurInput);
    blurGroup.appendChild(blurValue);
    
    // Shadow color
    const colorGroup = document.createElement('div');
    colorGroup.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 5px;
    `;
    
    const colorLabel = document.createElement('label');
    colorLabel.textContent = 'Shadow Color:';
    colorLabel.style.cssText = `
      font-weight: 500;
      color: #333;
    `;
    
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = '#000000';
    colorInput.style.cssText = `
      width: 100%;
      height: 40px;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
    `;
    
    colorInput.addEventListener('input', updatePreview);
    
    colorGroup.appendChild(colorLabel);
    colorGroup.appendChild(colorInput);
    
    // Preview
    const previewGroup = document.createElement('div');
    previewGroup.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 5px;
    `;
    
    const previewLabel = document.createElement('label');
    previewLabel.textContent = 'Preview:';
    previewLabel.style.cssText = `
      font-weight: 500;
      color: #333;
    `;
    
    const previewText = document.createElement('div');
    previewText.textContent = 'Sample Text';
    previewText.style.cssText = `
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #f8f9fa;
      font-size: 18px;
      text-align: center;
      min-height: 20px;
    `;
    
    previewGroup.appendChild(previewLabel);
    previewGroup.appendChild(previewText);
    
    // Quick test button
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Test Simple Shadow';
    testBtn.style.cssText = `
      padding: 8px 12px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-top: 10px;
    `;
    
    testBtn.addEventListener('click', () => {
      this.applyTextShadow('2px 2px 4px rgba(0, 0, 0, 0.5)');
      document.body.removeChild(overlay);
    });
    
    // Buttons
    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = `
      display: flex;
      gap: 10px;
      margin-top: 20px;
    `;
    
    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Apply';
    applyBtn.style.cssText = `
      flex: 1;
      padding: 10px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      flex: 1;
      padding: 10px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    
    // Update preview function
    const updatePreview = () => {
      const hOffset = hOffsetInput.value + 'px';
      const vOffset = vOffsetInput.value + 'px';
      const blur = blurInput.value + 'px';
      const color = colorInput.value;
      
      previewText.style.textShadow = `${hOffset} ${vOffset} ${blur} ${color}`;
    };
    
    // Apply shadow
    applyBtn.addEventListener('click', () => {
      const hOffset = hOffsetInput.value + 'px';
      const vOffset = vOffsetInput.value + 'px';
      const blur = blurInput.value + 'px';
      const color = colorInput.value;
      const shadowValue = `${hOffset} ${vOffset} ${blur} ${color}`;
      
      this.applyTextShadow(shadowValue);
      document.body.removeChild(overlay);
    });
    
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    buttonGroup.appendChild(applyBtn);
    buttonGroup.appendChild(cancelBtn);
    
    // Assemble form
    form.appendChild(hOffsetGroup);
    form.appendChild(vOffsetGroup);
    form.appendChild(blurGroup);
    form.appendChild(colorGroup);
    form.appendChild(previewGroup);
    form.appendChild(testBtn);
    form.appendChild(buttonGroup);
    
    // Assemble dialog
    dialog.appendChild(header);
    dialog.appendChild(form);
    overlay.appendChild(dialog);
    
    // Add to page
    document.body.appendChild(overlay);
    
    // Initialize preview
    updatePreview();
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
    
    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  applyTextShadow(shadowValue) {
    try {
      const selection = window.getSelection();
      if (!selection.rangeCount) {
        this.showNotification('Please select text to apply shadow', 'warning');
        return;
      }

      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.textShadow = shadowValue;
      
      // Wrap the selected content in the span
      range.surroundContents(span);
      
      // Clear the selection
      selection.removeAllRanges();
      
      this.showNotification('Text shadow applied successfully', 'success');
      this.recordHistory();
    } catch (error) {
      this.showNotification('Failed to apply text shadow', 'error');
    }
  }

  toggleDropCap() {
    try {
      const selection = window.getSelection();
      if (!selection.rangeCount) {
        this.showNotification('Please select text to apply drop cap', 'warning');
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (selectedText) {
        // Apply drop cap to selected text
        const span = document.createElement('span');
        span.style.cssText = `
          float: left;
          font-size: 3em;
          line-height: 0.8;
          margin: 0.1em 0.1em 0 0;
          font-weight: bold;
        `;
        span.textContent = selectedText.charAt(0);
        
        const restSpan = document.createElement('span');
        restSpan.textContent = selectedText.slice(1);
        
        range.deleteContents();
        range.insertNode(span);
        range.setStartAfter(span);
        range.insertNode(restSpan);
        
        this.showNotification('Drop cap applied to selection', 'success');
      } else {
        // Apply drop cap to current paragraph
        const paragraph = this.getCurrentParagraph();
        if (paragraph && paragraph.textContent.trim()) {
          const firstChar = paragraph.textContent.charAt(0);
          const restText = paragraph.textContent.slice(1);
          
          const dropCapSpan = document.createElement('span');
          dropCapSpan.style.cssText = `
            float: left;
            font-size: 3em;
            line-height: 0.8;
            margin: 0.1em 0.1em 0 0;
            font-weight: bold;
          `;
          dropCapSpan.textContent = firstChar;
          
          paragraph.innerHTML = '';
          paragraph.appendChild(dropCapSpan);
          paragraph.appendChild(document.createTextNode(restText));
          
          this.showNotification('Drop cap applied to paragraph', 'success');
        } else {
          this.showNotification('No paragraph found to apply drop cap', 'warning');
        }
      }
      
      this.editable.focus();
      this.recordHistory();
    } catch (error) {
      this.showNotification('Failed to toggle drop cap', 'error');
    }
  }

  // Fix corrupted content and reset editor state
  resetEditor() {
    try {
      // Reset state
      this.state.isCodeView = false;
      this.state.isPreview = false;
      this.state.lastHTML = null;
      
      // Reset UI
      const codeBtn = document.getElementById('codeview');
      const previewBtn = document.getElementById('preview');
      
      if (codeBtn) {
        codeBtn.classList.remove('active');
        codeBtn.title = 'Code View';
      }
      
      if (previewBtn) {
        previewBtn.classList.remove('active');
        previewBtn.title = 'Preview';
        this.container.classList.remove('preview-mode');
      }
      
      // Remove code-view class from editable and ensure it's editable
      this.editable.classList.remove('code-view');
      this.editable.contentEditable = true;
      
      // Clear any corrupted content and set clean default
      this.editable.innerHTML = '<p>Start typing here...</p>';
      
      // Clear history to prevent corrupted content from being restored
      this.state.history = [];
      this.state.historyIndex = -1;
      
      // Record the clean state
      this.recordHistory();
      
      // Update footer
      this.updateFooter();
      
      // Focus the editor
      this.editable.focus();
      
      this.showNotification('Editor reset successfully', 'success');
    } catch (error) {
      console.error('Failed to reset editor:', error);
      this.showNotification('Failed to reset editor', 'error');
    }
  }

  // Detect and fix corrupted content automatically
  fixCorruptedContent() {
    try {
      const currentContent = this.editable.innerHTML;
      
      // Check if content looks like HTML but is being displayed as text
      if (currentContent.includes('<span style="letter-spacing:') || 
          currentContent.includes('<span style="word-spacing:') ||
          (currentContent.includes('<') && currentContent.includes('>') && this.state.isCodeView === false)) {
        
        // Content is corrupted - fix it
        this.showNotification('Detected corrupted content. Fixing...', 'warning');
        
        // Try to parse the content as HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = currentContent;
        
        // If the content was actually HTML, set it properly
        if (tempDiv.children.length > 0 || tempDiv.innerHTML !== currentContent) {
          this.editable.innerHTML = currentContent;
        } else {
          // Content is truly corrupted, reset to clean state
          this.resetEditor();
          return;
        }
        
        // Ensure we're not in code view
        this.state.isCodeView = false;
        this.editable.classList.remove('code-view');
        const codeBtn = document.getElementById('codeview');
        if (codeBtn) {
          codeBtn.classList.remove('active');
          codeBtn.title = 'Code View';
        }
        
        this.showNotification('Content fixed successfully', 'success');
      }
      
      // Also ensure proper structure
      this.ensureProperStructure();
      
    } catch (error) {
      console.error('Failed to fix corrupted content:', error);
      this.showNotification('Failed to fix content, resetting editor', 'error');
      this.resetEditor();
    }
  }

  // Helper method to explain HTML structure
  explainHTMLStructure() {
    const currentHTML = this.editable.innerHTML;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = currentHTML;
    
    let explanation = 'Current HTML Structure:\n\n';
    
    const explainNode = (node, indent = 0) => {
      const spaces = '  '.repeat(indent);
      
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
          explanation += `${spaces}Text: "${text}"\n`;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        explanation += `${spaces}<${node.tagName.toLowerCase()}`;
        
        // Show important attributes
        if (node.className) explanation += ` class="${node.className}"`;
        if (node.id) explanation += ` id="${node.id}"`;
        if (node.style.cssText) explanation += ` style="..."`;
        
        explanation += '>\n';
        
        // Process children
        for (let child of node.childNodes) {
          explainNode(child, indent + 1);
        }
        
        explanation += `${spaces}</${node.tagName.toLowerCase()}>\n`;
      }
    };
    
    explainNode(tempDiv);
    
    // Show this in a dialog or notification
    this.showNotification('Check console for HTML structure explanation', 'info');
    console.log(explanation);
  }

  // Debug method to show current state
  debugCodeView() {
    console.log('=== Code View Debug ===');
    console.log('Is Code View:', this.state.isCodeView);
    console.log('Last HTML:', this.state.lastHTML);
    console.log('Current innerHTML:', this.editable.innerHTML);
    console.log('Current textContent:', this.editable.textContent);
    console.log('======================');
  }
  
  // Test method to demonstrate code view
  testCodeView() {
    // Set a simple test content
    this.setContent('<p>Hello World</p><div>Test Content</div>');
    
    console.log('=== Code View Test ===');
    console.log('1. Initial HTML:', this.editable.innerHTML);
    
    // Enter code view
    this.state.isCodeView = true;
    this.state.lastHTML = this.editable.innerHTML;
    this.editable.textContent = this.editable.innerHTML;
    console.log('2. In Code View (textContent):', this.editable.textContent);
    
    // Simulate editing in code view
    this.editable.textContent = '<p>Hello World</p><div>Modified Content</div>';
    console.log('3. After editing in code view:', this.editable.textContent);
    
    // Exit code view
    this.state.isCodeView = false;
    this.editable.innerHTML = this.editable.textContent;
    console.log('4. After exiting code view:', this.editable.innerHTML);
    console.log('=== End Test ===');
  }

  // Ensure proper HTML structure
  ensureProperStructure() {
    const html = this.editable.innerHTML;
    
    // If the content is just plain text without any HTML tags, wrap it in a paragraph
    if (!html.includes('<') || html.trim() === html) {
      // Check if there are any text nodes at the root level
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      let needsWrapping = false;
      for (let child of tempDiv.childNodes) {
        if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
          needsWrapping = true;
          break;
        }
      }
      
      if (needsWrapping) {
        // Wrap text content in paragraphs
        let newHTML = '';
        for (let child of tempDiv.childNodes) {
          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent.trim();
            if (text) {
              newHTML += `<p>${text}</p>`;
            }
          } else {
            newHTML += child.outerHTML;
          }
        }
        
        if (newHTML) {
          this.editable.innerHTML = newHTML;
          this.showNotification('Content structure fixed', 'info');
        }
      }
    }
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WYSIWYGEditor;
}