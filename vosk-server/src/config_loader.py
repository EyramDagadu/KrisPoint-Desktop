import json
import os
from pathlib import Path
from typing import Dict, List, Any, Optional, Union

class ConfigLoader:
    """Configuration loader for Whisper Streaming Engine with hot-reload support"""
    
    def __init__(self, config_dir: Optional[Union[str, Path]] = None):
        if config_dir is None:
            # Default to config directory relative to this file
            current_dir = Path(__file__).parent.parent
            config_dir = current_dir / "config"
        
        self.config_dir = Path(config_dir) if isinstance(config_dir, str) else config_dir
        self._configs = {}
        self._load_all()
    
    def _load_json(self, filename: str) -> Dict:
        """Load a JSON configuration file"""
        filepath = self.config_dir / filename
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: Config file not found: {filepath}")
            return {}
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON in {filepath}: {e}")
            return {}
    
    def _load_all(self):
        """Load all configuration files"""
        self._configs['medical_vocab'] = self._load_json('medical_vocab.json')
        self._configs['voice_commands'] = self._load_json('voice_commands.json')
        self._configs['model_settings'] = self._load_json('model_settings.json')
    
    def reload(self):
        """Reload all configurations (hot-reload support)"""
        print("Reloading all configurations...")
        self._load_all()
        print("Configuration reload complete")
    
    def get_medical_vocabulary(self) -> List[str]:
        """Get medical vocabulary terms for Whisper initial_prompt"""
        vocab_config = self._configs.get('medical_vocab', {})
        if not vocab_config.get('enabled', True):
            return []
        return vocab_config.get('terms', [])
    
    def get_initial_prompt(self) -> str:
        """Generate initial_prompt string for Whisper from medical vocabulary"""
        terms = self.get_medical_vocabulary()
        if not terms:
            return ""
        
        # Build prompt respecting max_prompt_length strictly
        max_length = self._configs.get('medical_vocab', {}).get('max_prompt_length', 244)
        
        prompt_parts = []
        current_length = 0
        
        for term in terms:
            # Account for comma and space
            addition = f"{term}, "
            test_length = current_length + len(addition)
            
            # Leave room for final period (1 char)
            if test_length + 1 > max_length:
                break
            
            prompt_parts.append(term)
            current_length = test_length
        
        # Join with commas and end with period
        prompt = ", ".join(prompt_parts)
        if prompt and not prompt.endswith('.'):
            prompt += "."
        
        return prompt
    
    def get_voice_commands(self) -> Dict[str, List[str]]:
        """Get categorized voice commands"""
        cmd_config = self._configs.get('voice_commands', {})
        if not cmd_config.get('enabled', True):
            return {}
        return cmd_config.get('commands', {})
    
    def get_all_commands(self) -> List[str]:
        """Get flat list of all voice commands"""
        commands = self.get_voice_commands()
        all_commands = []
        for category_commands in commands.values():
            all_commands.extend(category_commands)
        return all_commands
    
    def get_model_settings(self) -> Dict[str, Any]:
        """Get complete model settings configuration"""
        return self._configs.get('model_settings', {})
    
    def get_model_config(self) -> Dict[str, Any]:
        """Get model-specific configuration"""
        settings = self.get_model_settings()
        return settings.get('model', {})
    
    def get_streaming_config(self) -> Dict[str, Any]:
        """Get streaming-specific configuration"""
        settings = self.get_model_settings()
        return settings.get('streaming', {})
    
    def get_transcription_config(self) -> Dict[str, Any]:
        """Get transcription-specific configuration"""
        settings = self.get_model_settings()
        return settings.get('transcription', {})
    
    def get_performance_config(self) -> Dict[str, Any]:
        """Get performance-specific configuration"""
        settings = self.get_model_settings()
        return settings.get('performance', {})
    
    def update_config(self, config_name: str, updates: Dict):
        """Update a specific configuration and save to file"""
        if config_name not in self._configs:
            print(f"Warning: Unknown config: {config_name}")
            return False
        
        # Update in memory
        self._configs[config_name].update(updates)
        
        # Save to file
        filename = f"{config_name}.json"
        filepath = self.config_dir / filename
        try:
            with open(filepath, 'w') as f:
                json.dump(self._configs[config_name], f, indent=2)
            print(f"Updated configuration: {config_name}")
            return True
        except Exception as e:
            print(f"Error saving config {config_name}: {e}")
            return False
    
    def __repr__(self):
        vocab_count = len(self.get_medical_vocabulary())
        cmd_count = len(self.get_all_commands())
        model_size = self.get_model_config().get('size', 'unknown')
        return f"ConfigLoader(vocab={vocab_count} terms, commands={cmd_count}, model={model_size})"


# Global config instance for easy import
config = ConfigLoader()

if __name__ == "__main__":
    # Test configuration loading
    print("=== Configuration Loader Test ===\n")
    
    print(f"Config: {config}\n")
    
    print(f"Medical Vocabulary ({len(config.get_medical_vocabulary())} terms):")
    print(config.get_medical_vocabulary()[:10], "...\n")
    
    print(f"Initial Prompt ({len(config.get_initial_prompt())} chars):")
    print(config.get_initial_prompt()[:200], "...\n")
    
    print(f"Voice Commands ({len(config.get_all_commands())} total):")
    for category, commands in config.get_voice_commands().items():
        print(f"  {category}: {len(commands)} commands")
    print()
    
    print("Model Settings:")
    print(f"  Model: {config.get_model_config().get('size')}")
    print(f"  Compute: {config.get_model_config().get('compute_type')}")
    print(f"  Target Latency: {config.get_performance_config().get('target_latency_ms')}ms")
    print(f"  Max Memory: {config.get_performance_config().get('max_memory_mb')}MB")
