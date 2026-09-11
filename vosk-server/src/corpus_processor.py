"""
Corpus Processor - Extracts medical terms from radiology corpus
for Whisper initial_prompt optimization
"""
import re
from collections import Counter
from pathlib import Path

class CorpusProcessor:
    def __init__(self, corpus_path, commands_path):
        self.corpus_path = Path(corpus_path)
        self.commands_path = Path(commands_path)
        self.medical_terms = []
        self.common_phrases = []
        
    def extract_medical_terms(self, top_n=300, max_lines=50000):
        """Extract top N medical terms from corpus (streaming for large files)"""
        print(f"Processing corpus: {self.corpus_path}")
        
        # Medical term patterns
        medical_keywords = [
            'fracture', 'stenosis', 'compression', 'vertebral', 'disc', 'bulge',
            'herniation', 'spinal', 'cord', 'edema', 'oedema', 'atelectasis',
            'pneumothorax', 'effusion', 'consolidation', 'opacity', 'lesion',
            'mass', 'nodule', 'cardiomegaly', 'hemorrhage', 'infarct', 'ischemia',
            'hyperintense', 'hypointense', 'signal', 'enhancement', 'contrast',
            'diffusion', 'restricted', 'facilitated', 'flair', 'dwi', 'adc',
            'thecal', 'foramina', 'facet', 'arthrosis', 'osteophyte', 'modic',
            'schmorl', 'spondylosis', 'stenotic', 'myelopathy', 'radiculopathy',
            'parenchyma', 'ventricle', 'sulci', 'gyri', 'cerebellar', 'cerebral'
        ]
        
        word_counts = Counter()
        phrase_counts = Counter()
        line_count = 0
        
        # Stream process file (don't load all into memory)
        with open(self.corpus_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line_count >= max_lines:
                    break
                
                line = line.lower().strip()
                if not line or line.startswith('#'):
                    continue
                
                # Extract words
                words = re.findall(r'\b\w+\b', line)
                word_counts.update(words)
                
                # Extract key phrases
                if 'no acute' in line:
                    phrase_counts['no acute intracranial hemorrhage'] += 1
                if 'compression fracture' in line:
                    phrase_counts['compression fracture'] += 1
                if 'spinal canal stenosis' in line:
                    phrase_counts['spinal canal stenosis'] += 1
                if 'disc bulge' in line:
                    phrase_counts['disc bulge'] += 1
                if 'neural foramina' in line:
                    phrase_counts['neural foramina'] += 1
                if 'within normal limits' in line:
                    phrase_counts['within normal limits'] += 1
                
                line_count += 1
                if line_count % 10000 == 0:
                    print(f"Processed {line_count} lines...")
        
        print(f"Processed {line_count} lines total")
        
        # Get common phrases
        self.common_phrases = [phrase for phrase, count in phrase_counts.most_common(30)]
        
        # Filter for medical terms
        medical_word_counts = {
            word: count for word, count in word_counts.items()
            if any(keyword in word for keyword in medical_keywords)
            or len(word) > 10  # Very long words are often medical terms
        }
        
        # Get top N terms
        self.medical_terms = [
            word for word, count in 
            sorted(medical_word_counts.items(), key=lambda x: x[1], reverse=True)[:top_n]
        ]
        
        return self.medical_terms
    
    def load_commands(self):
        """Load voice commands from file"""
        print(f"Loading commands: {self.commands_path}")
        
        with open(self.commands_path, 'r', encoding='utf-8') as f:
            commands = [line.strip() for line in f if line.strip()]
        
        # Categorize commands
        navigation = [c for c in commands if any(word in c for word in ['go to', 'select', 'next', 'previous'])]
        formatting = [c for c in commands if any(word in c for word in ['bold', 'italic', 'underline', 'insert', 'comma', 'period'])]
        sections = [c for c in commands if any(word in c for word in ['section', 'findings', 'impression', 'technique', 'history'])]
        templates = [c for c in commands if any(word in c for word in ['template', 'normal', 'unremarkable', 'stable'])]
        
        return {
            'navigation': navigation,
            'formatting': formatting,
            'sections': sections,
            'templates': templates,
            'all': commands
        }
    
    def build_initial_prompt(self, max_tokens=200):
        """Build optimized initial_prompt for Whisper (max 224 tokens)"""
        
        # Start with core medical context
        prompt = "Medical radiology report dictation. Common terms: "
        
        # Add top medical terms (prioritize short, high-impact words)
        terms_to_add = []
        current_length = len(prompt.split())
        
        for term in self.medical_terms[:100]:  # Check top 100
            if current_length + len(term.split()) < max_tokens:
                terms_to_add.append(term)
                current_length += len(term.split())
            else:
                break
        
        # Add key phrases
        for phrase in self.common_phrases[:20]:
            if current_length + len(phrase.split()) < max_tokens:
                terms_to_add.append(phrase)
                current_length += len(phrase.split())
            else:
                break
        
        prompt += ", ".join(terms_to_add) + "."
        
        return prompt
    
    def save_vocabulary(self, output_path):
        """Save extracted vocabulary to file"""
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("# MEDICAL VOCABULARY FOR WHISPER\n\n")
            f.write("## Top Medical Terms:\n")
            for term in self.medical_terms[:100]:
                f.write(f"- {term}\n")
            f.write("\n## Common Phrases:\n")
            for phrase in self.common_phrases:
                f.write(f"- {phrase}\n")

if __name__ == "__main__":
    # Process corpus
    processor = CorpusProcessor(
        corpus_path="../data/radiology_corpus.txt",
        commands_path="../data/voice_commands.txt"
    )
    
    # Extract medical terms
    terms = processor.extract_medical_terms(top_n=300)
    print(f"\nExtracted {len(terms)} medical terms")
    
    # Load commands
    commands = processor.load_commands()
    print(f"Loaded {len(commands['all'])} voice commands")
    
    # Build initial prompt
    initial_prompt = processor.build_initial_prompt(max_tokens=200)
    print(f"\nInitial Prompt ({len(initial_prompt.split())} words):")
    print(initial_prompt[:500] + "...")
    
    # Save vocabulary
    processor.save_vocabulary("../data/medical_vocabulary.txt")
    print("\nVocabulary saved to: ../data/medical_vocabulary.txt")
