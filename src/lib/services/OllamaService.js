// OllamaService - Local AI Integration for Medical Report Refinement
// Uses Mistral 7B for medical-grade report generation and polishing

import { browser } from '$app/environment';
import { invoke } from '@tauri-apps/api/core';

class OllamaService {
  constructor() {
    // For LAN access: use same hostname as the web page
    // Ollama must also be configured to listen on 0.0.0.0 (set OLLAMA_HOST=0.0.0.0)
    this.baseUrl = this.getOllamaUrl();
    this.model = 'mistral:7b';
    this.isAvailable = false;
    this._isTauriRuntime = null; // Cache the result
  }

  getOllamaUrl() {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // If accessing via IP or non-localhost, use that hostname for Ollama
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        console.log(`🤖 Ollama URL set to server IP: http://${hostname}:11434`);
        return `http://${hostname}:11434`;
      }
    }
    return 'http://localhost:11434';
  }

  // Detect if we're running in a real Tauri desktop app (not dev server)
  isTauriRuntime() {
    if (this._isTauriRuntime !== null) return this._isTauriRuntime;
    
    // Tauri's IPC globals remain authoritative even when Solo is served from
    // its authenticated dynamic loopback backend.
    if (typeof window !== 'undefined') {
      const hasTauriIpc = Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__?.core);
      if (hasTauriIpc) {
        console.log('✅ Tauri desktop app detected (host: ' + window.location.hostname + ')');
        this._isTauriRuntime = true;
        return true;
      }
    }
    
    console.log('🌐 Browser/dev mode detected (host: ' + window.location.hostname + ')');
    this._isTauriRuntime = false;
    return false;
  }

  // Make HTTP request using Tauri backend command or browser fetch
  async makeRequest(url, options = {}) {
    if (this.isTauriRuntime()) {
      console.log('🖥️ Using Tauri backend HTTP proxy (CORS-free)');
      console.log('📤 Request:', { url, method: options.method, headers: options.headers });
      
      try {
        // Use Tauri backend command to make the request
        console.log('⏳ Waiting for Tauri backend response...');
        const response = await invoke('http_request', {
          request: {
            url: url,
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.body || null
          }
        });
        
        console.log('✅ Tauri backend response received:', {
          status: response.status,
          bodyLength: response.body?.length || 0
        });
        
        // Simulate fetch API Response object
        return {
          ok: response.status >= 200 && response.status < 300,
          status: response.status,
          statusText: response.status === 200 ? 'OK' : 'Error',
          headers: response.headers,
          text: async () => response.body,
          json: async () => JSON.parse(response.body)
        };
      } catch (error) {
        console.error('❌ Tauri backend error:', error);
        throw new Error(`Tauri HTTP request failed: ${error.message || error}`);
      }
    } else {
      console.log('🌐 Using browser fetch');
      return fetch(url, options);
    }
  }

  // Check if Ollama is running
  async checkAvailability() {
    if (!browser) return false;
    
    const isTauri = this.isTauriRuntime();
    console.log('🔍 Checking Ollama availability...', { 
      isTauri, 
      baseUrl: this.baseUrl 
    });
    
    try {
      console.log('📡 Sending request to:', `${this.baseUrl}/api/tags`);
      
      const response = await this.makeRequest(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📥 Ollama response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      // Try to get response body for debugging
      if (!response.ok) {
        try {
          const errorBody = await response.text();
          console.error('❌ Error response body:', errorBody);
        } catch (e) {
          console.error('❌ Could not read error body');
        }
      }
      
      this.isAvailable = response.ok || response.status === 200;
      
      if (this.isAvailable) {
        console.log('✅ Ollama is available and running');
      } else {
        console.warn('⚠️ Ollama responded but not OK:', response.status);
      }
      
      return this.isAvailable;
    } catch (error) {
      console.error('❌ Ollama availability check failed:', {
        message: error.message,
        error: error
      });
      this.isAvailable = false;
      return false;
    }
  }

  // Set custom Ollama URL and model
  setConfig(url, model) {
    this.baseUrl = url || 'http://localhost:11434';
    this.model = model || 'mistral:7b';
  }

  // Get current configuration
  getConfig() {
    return {
      baseUrl: this.baseUrl,
      model: this.model
    };
  }

  /**
   * Strip HTML tags from content for clean AI processing
   * Preserves text content while removing all HTML formatting
   */
  stripHtml(htmlContent) {
    if (!htmlContent) return '';
    
    // Replace common block elements with newlines
    let text = htmlContent
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n');
    
    // Remove all remaining HTML tags
    text = text.replace(/<[^>]*>/g, '');
    
    // Decode common HTML entities
    text = text
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&bull;/gi, '•');
    
    // Clean up multiple newlines and trim
    text = text
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
    
    return text;
  }

  /**
   * SMART AI REFINE - Auto-detects whether to generate full report or polish
   * Analyzes report completeness and acts accordingly
   */
  async smartRefine(reportContent, indication, templateType, patientInfo, onChunk = null) {
    if (!this.isAvailable) {
      throw new Error('Ollama is not running. Please start Ollama and try again.');
    }

    // Strip HTML tags for clean AI processing
    const cleanContent = this.stripHtml(reportContent);
    const cleanIndication = this.stripHtml(indication);
    
    console.log('🧹 Stripped HTML from content:', {
      originalLength: reportContent.length,
      cleanLength: cleanContent.length,
      hadHtml: reportContent.includes('<')
    });

    const completeness = this.analyzeCompleteness(cleanContent);
    
    if (completeness.isComplete) {
      // Report has structure - just polish it
      return this.polishReport(cleanContent, onChunk);
    } else {
      // Raw findings - generate full report
      return this.generateFullReport(cleanContent, cleanIndication, templateType, onChunk);
    }
  }

  /**
   * GENERATE FULL REPORT - Convert raw findings into structured radiology report
   * Airtight prompt for Mistral - leaves NO room for interpretation
   */
  async generateFullReport(rawFindings, indication, templateType = 'General', onChunk = null) {
    if (!this.isAvailable) {
      throw new Error('Ollama is not running.');
    }

    const prompt = `You are a professional radiologist report writer. Your task is ONLY to rewrite findings into a structured radiology report.

STRICT RULES:
1. Output EXACTLY this structure with these section headers:
   COMPARISON:
   [single line - reference comparison or state if unavailable]
   
   TECHNIQUE:
   [2-3 sentences describing imaging technique]
   
   FINDINGS:
   [rewritten findings from input, organized by anatomy, professional language, NO speculation]
   
   IMPRESSION:
   [1-3 sentences - concise diagnostic impression based ONLY on findings]

2. MANDATORY REQUIREMENTS:
   - Use professional radiology terminology ONLY
   - NO personal observations, NO speculation, NO "suggestive of"
   - Format findings as paragraphs OR bullet points (•) - choose what's most appropriate for the content
   - If findings are simple/few, use paragraphs; if multiple findings, use bullet points
   - Impression must match findings exactly - no extra diagnoses
   - Keep language precise, concise, medical-grade

3. INPUT DATA:
   Clinical Indication: ${indication || 'Not provided'}
   Report Type: ${templateType}
   Raw Findings: ${rawFindings}

CRITICAL: Output the report structure EXACTLY as shown above. Do not add any extra text before or after.`;

    return this.callOllama(prompt, onChunk);
  }

  /**
   * POLISH REPORT - Refine professional language and medical terminology
   * Airtight prompt - preserves structure, improves clarity only
   */
  async polishReport(reportContent, onChunk = null) {
    if (!this.isAvailable) {
      throw new Error('Ollama is not running.');
    }

    const prompt = `You are a professional radiologist editor. Your task is ONLY to improve the language and clarity of a radiology report.

STRICT RULES:
1. PRESERVE the existing structure:
   - Keep all sections: COMPARISON, TECHNIQUE, FINDINGS, IMPRESSION
   - Keep all findings and content - do NOT remove or add findings
   - Keep all section headers exactly as they are

2. IMPROVEMENTS ALLOWED ONLY:
   - Fix grammar and spelling
   - Improve medical terminology (more professional)
   - Clarify awkward sentences
   - Standardize formatting (consistent terminology)
   - Remove redundancy within the same section

3. IMPROVEMENTS FORBIDDEN:
   - Do NOT add new findings
   - Do NOT change findings content or meaning
   - Do NOT modify impression (keep exact same clinical meaning)
   - Do NOT reorganize sections
   - Do NOT change section headers

4. REPORT TO EDIT:
${reportContent}

CRITICAL: Output the complete polished report with ALL sections intact. Make NO structural changes.`;

    return this.callOllama(prompt, onChunk);
  }

  /**
   * SMART IMPRESSION GENERATOR - Create impression from indication + findings
   * Used when user has findings but needs help with impression
   */
  async generateImpression(indication, findings) {
    if (!this.isAvailable) {
      throw new Error('Ollama is not running.');
    }

    // Strip HTML tags for clean AI processing
    const cleanIndication = this.stripHtml(indication);
    const cleanFindings = this.stripHtml(findings);

    const prompt = `You are a radiologist creating an impression for a medical report.

STRICT RULES:
1. Output ONLY the impression text - nothing else
2. Impression MUST be based ONLY on the provided findings
3. Impression must be 1-3 sentences, concise and professional
4. Use definitive language (not speculative like "suggestive of", "cannot exclude")
5. If findings are normal, state normal and list the study type
6. If findings are abnormal, state the findings and their clinical relevance

INPUT:
Clinical Indication: ${cleanIndication || 'Not provided'}
Findings: ${cleanFindings}

CRITICAL: Respond with ONLY the impression text. No labels, no extra text. Start directly with the impression.`;

    return this.callOllama(prompt);
  }

  /**
   * Call Ollama API with streaming
   */
  async callOllama(prompt, onChunk = null) {
    try {
      let fullResponse = '';

      const requestBody = {
        model: this.model,
        prompt: prompt,
        stream: true,
        temperature: 0.3, // Lower temp for more consistent output
      };

      const isTauri = this.isTauriRuntime();

      console.log('🚀 Ollama request:', { 
        isTauri,
        url: `${this.baseUrl}/api/generate`, 
        model: this.model,
        fetchType: isTauri ? 'Tauri backend proxy (no streaming)' : 'Browser fetch (streaming)',
        env: import.meta.env?.TAURI_PLATFORM || 'browser'
      });

      const response = await this.makeRequest(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Ollama response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ollama error response:', errorText);
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      if (isTauri) {
        // Tauri fetch doesn't support ReadableStream - get full response at once
        console.log('🖥️ Tauri mode: Getting full response (no streaming)');
        const text = await response.text();
        const lines = text.split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.response) {
              fullResponse += json.response;
            }
          } catch (e) {
            // Ignore JSON parse errors for incomplete lines
          }
        }
        
        // In Tauri mode, call onChunk ONCE with the complete response
        if (onChunk && fullResponse) {
          console.log('✅ Full response ready, length:', fullResponse.length);
          onChunk(fullResponse);
        }
      } else {
        // Browser fetch supports streaming with ReadableStream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
              const json = JSON.parse(line);
              if (json.response) {
                fullResponse += json.response;
                console.log('🔄 Streaming token:', json.response);
                
                // Call onChunk for EVERY token to show real-time streaming
                if (onChunk) {
                  onChunk(fullResponse);
                }
              }
            } catch (e) {
              console.warn('JSON parse error:', e.message, 'Line:', line);
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim()) {
          try {
            const json = JSON.parse(buffer);
            if (json.response) {
              fullResponse += json.response;
              if (onChunk) onChunk(fullResponse);
            }
          } catch (e) {
            // Ignore final parse errors
          }
        }
      }

      console.log('✅ Ollama generation complete, total length:', fullResponse.length);
      return fullResponse.trim();
    } catch (error) {
      console.error('❌ Ollama API error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        error: error
      });
      throw error;
    }
  }

  /**
   * Analyze report completeness
   * Returns true if report has main sections (Technique, Findings, Impression)
   */
  analyzeCompleteness(content) {
    const hasComparison = /COMPARISON:/i.test(content);
    const hasTechnique = /TECHNIQUE:/i.test(content);
    const hasFindings = /FINDINGS:/i.test(content);
    const hasImpression = /IMPRESSION:/i.test(content);

    const textLength = content.replace(/\s+/g, ' ').length;
    const hasSubstantialContent = textLength > 300; // At least 300 chars of real content

    const isComplete = hasTechnique && hasFindings && hasImpression && hasSubstantialContent;

    return {
      isComplete,
      sections: { hasComparison, hasTechnique, hasFindings, hasImpression },
      contentLength: textLength
    };
  }
}

export const ollamaService = new OllamaService();
