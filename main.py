import os
import eel
import threading
import time
import sys
from datetime import datetime

# Suppress AI library warnings
import warnings
warnings.filterwarnings("ignore")
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

from engine.features import *
from engine.command import *
from engine.auth import recoganize
from engine.system_monitor import getSystemStats
import json

# Fingerprint authentication using ADB
import subprocess
import hashlib
import json
import os
import time

def AuthenticateFingerprint():
    data_file = 'engine/auth/fingerprint_data.json'
    
    # No data storage needed
    
    def get_fingerprint():
        try:
            adb_path = r'C:\platform-tools\adb.exe'
            
            print("Lock your phone first, then use fingerprint to unlock...")
            
            # Lock the phone first
            subprocess.run([adb_path, 'shell', 'input', 'keyevent', 'KEYCODE_POWER'], timeout=2)
            time.sleep(1)
            
            # Wake and wait for fingerprint unlock
            subprocess.run([adb_path, 'shell', 'input', 'keyevent', 'KEYCODE_WAKEUP'], timeout=2)
            print("Phone locked. Use fingerprint to unlock now...")
            time.sleep(5)  # Give time for fingerprint unlock
            
            # Check if phone is actually unlocked by checking keyguard state
            keyguard_result = subprocess.run([adb_path, 'shell', 'dumpsys', 'window'], 
                                            capture_output=True, text=True, timeout=3)
            
            # Check if keyguard (lock screen) is gone
            if keyguard_result.returncode == 0 and 'mDreamingLockscreen=false' in keyguard_result.stdout:
                # Double check with power state
                power_result = subprocess.run([adb_path, 'shell', 'dumpsys', 'power'], 
                                            capture_output=True, text=True, timeout=2)
                
                if 'mWakefulness=Awake' in power_result.stdout:
                    # Get device serial
                    serial_result = subprocess.run([adb_path, 'shell', 'getprop', 'ro.serialno'], 
                                                 capture_output=True, text=True, timeout=2)
                    if serial_result.returncode == 0:
                        device_id = serial_result.stdout.strip()
                        print(f"Fingerprint unlock successful: {device_id[:8]}...")
                        return f"fingerprint_{device_id}"
            
            print("Fingerprint unlock failed - phone still locked")
            return None
        except Exception as e:
            print(f"Fingerprint error: {e}")
            return None
    
    # No stored data needed
    
    # No registration needed - just check unlock capability
    print("Fingerprint authentication ready...")
    
    print("Authenticating...")
    time.sleep(1)
    
    # Only check if phone is unlocked, no hash comparison
    if get_fingerprint():
        print("Phone unlocked with fingerprint - Authentication successful!")
        return True
    else:
        print("Phone not unlocked - Authentication failed")
        return False
from engine.voice_advanced_ai import voice_advanced_ai

def get_context_aware_greeting(user_id=None):
    """Generate context-aware greeting with user name"""
    from datetime import datetime
    import json
    
    current_hour = datetime.now().hour
    
    if 5 <= current_hour < 12:
        time_greeting = "Good Morning"
    elif 12 <= current_hour < 17:
        time_greeting = "Good Afternoon"
    elif 17 <= current_hour < 21:
        time_greeting = "Good Evening"
    else:
        time_greeting = "Good Night"
    
    # Get user name from database
    name = "Sir"
    if user_id:
        try:
            with open('users.json', 'r') as f:
                users = json.load(f)
                name = users.get(str(user_id), "Sir")
        except:
            pass
    
    return f"{time_greeting} {name}, Welcome! How can I help you today?"

def start():
    
    eel.init("www")

    playAssistantSound()
    
    @eel.expose
    def updateFaceAuthUI(status):
        """Update face auth status in UI"""
        try:
            eel.updateFaceAuthStatus(status)
        except:
            print(f"Face auth status: {status}")
    
    def get_biometric_config():
        try:
            with open('biometric_config.json', 'r') as f:
                return json.load(f)
        except:
            return {"face_auth_enabled": False, "fingerprint_auth_enabled": True}
    
    def save_biometric_config(config):
        with open('biometric_config.json', 'w') as f:
            json.dump(config, f)
    
    @eel.expose
    def getFaceAuthStatus():
        config = get_biometric_config()
        status_text = "Enabled" if config.get('face_auth_enabled', False) else "Disabled"
        return status_text
    
    @eel.expose
    def getFingerprintAuthStatus():
        config = get_biometric_config()
        status_text = "Enabled" if config.get('fingerprint_auth_enabled', True) else "Disabled"
        return status_text
    
    @eel.expose
    def enableFaceAuth():
        config = get_biometric_config()
        config['face_auth_enabled'] = True
        save_biometric_config(config)
        return "Enabled"
    
    @eel.expose
    def disableFaceAuth():
        config = get_biometric_config()
        config['face_auth_enabled'] = False
        save_biometric_config(config)
        return "Disabled"
    
    @eel.expose
    def enableFingerprintAuth():
        config = get_biometric_config()
        config['fingerprint_auth_enabled'] = True
        save_biometric_config(config)
        return "Enabled"
    
    @eel.expose
    def disableFingerprintAuth():
        config = get_biometric_config()
        config['fingerprint_auth_enabled'] = False
        save_biometric_config(config)
        return "Disabled"
    
    @eel.expose
    def setVoiceGender(gender):
        try:
            # Update voice config file
            with open('voice_config.json', 'w') as f:
                json.dump({"gender": gender}, f)
            
            # Reload voice control system
            from engine.voice_gender_control import voice_control
            voice_control.load_config()
            
            # Test the voice change
            voice_control.speak_with_gender(f"Voice changed to {gender}")
            
            return f"Voice set to {gender}"
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def getVoiceGender():
        try:
            with open('voice_config.json', 'r') as f:
                config = json.load(f)
                gender = config.get('gender', 'male')
                return gender.capitalize()
        except:
            return "Male"
    
    @eel.expose
    def setLanguage(language):
        try:
            # Update multilingual system
            from engine.multilingual_support import multilingual
            multilingual.current_language = language.lower()
            
            # Also update the text file for compatibility
            with open('current_language.txt', 'w') as f:
                f.write(language.lower())
            return f"Language set to {language}"
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def getCurrentLanguage():
        try:
            # Get from multilingual system first
            from engine.multilingual_support import multilingual
            current = multilingual.current_language
            return current.capitalize()
        except:
            # Fallback to file
            try:
                with open('current_language.txt', 'r') as f:
                    language = f.read().strip()
                    return language.capitalize()
            except:
                return "English"
    
    def get_ui_config():
        try:
            with open('ui_config.json', 'r') as f:
                return json.load(f)
        except:
            return {"voice_speed": "normal", "voice_volume": "medium", "auto_start": "disabled", "phone_notifications": "disabled"}
    
    def save_ui_config(config):
        with open('ui_config.json', 'w') as f:
            json.dump(config, f)
    
    @eel.expose
    def setVoiceSpeed(speed):
        try:
            config = get_ui_config()
            config['voice_speed'] = speed
            save_ui_config(config)
            
            # Test the new speed immediately
            from engine.voice_gender_control import voice_control
            voice_control.speak_with_gender(f"Voice speed changed to {speed}")
            
            return f"Voice speed set to {speed}"
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def setVoiceVolume(volume):
        try:
            config = get_ui_config()
            config['voice_volume'] = volume
            save_ui_config(config)
            
            # Test the new volume immediately
            from engine.voice_gender_control import voice_control
            voice_control.speak_with_gender(f"Voice volume changed to {volume}")
            
            return f"Voice volume set to {volume}"
        except Exception as e:
            return f"Error: {e}"
    

    
    @eel.expose
    def getVoiceSpeed():
        config = get_ui_config()
        return config.get('voice_speed', 'normal').capitalize()
    
    @eel.expose
    def getVoiceVolume():
        config = get_ui_config()
        return config.get('voice_volume', 'medium').capitalize()
    
    @eel.expose
    def enableAutoStart():
        try:
            from jarvis_startup import enable_auto_start
            if enable_auto_start():
                config = get_ui_config()
                config['auto_start'] = 'enabled'
                save_ui_config(config)
                return "Auto-start enabled successfully"
            return "Failed to enable auto-start"
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def disableAutoStart():
        try:
            from jarvis_startup import disable_auto_start
            if disable_auto_start():
                config = get_ui_config()
                config['auto_start'] = 'disabled'
                save_ui_config(config)
                return "Auto-start disabled successfully"
            return "Failed to disable auto-start"
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def getAutoStartStatus():
        try:
            config = get_ui_config()
            status = config.get('auto_start', 'disabled')
            return status.capitalize()
        except Exception as e:
            return "Disabled"
    
    @eel.expose
    def enablePhoneNotifications():
        try:
            from engine.phone_notifications import phone_monitor
            if not phone_monitor.monitoring:
                phone_monitor.start_monitoring()
            config = get_ui_config()
            config['phone_notifications'] = 'enabled'
            save_ui_config(config)
            return "Phone notifications enabled"
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def disablePhoneNotifications():
        try:
            from engine.phone_notifications import phone_monitor
            phone_monitor.stop_monitoring()
            config = get_ui_config()
            config['phone_notifications'] = 'disabled'
            save_ui_config(config)
            return "Phone notifications disabled"
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def getPhoneNotificationStatus():
        try:
            config = get_ui_config()
            status = config.get('phone_notifications', 'disabled')
            return status.capitalize()
        except Exception as e:
            return "Disabled"
    
    @eel.expose
    def enableSmsReading():
        try:
            from engine.phone_advanced import phone_advanced
            phone_advanced.start_sms_monitoring()
            config = get_ui_config()
            config['sms_reading'] = 'enabled'
            save_ui_config(config)
            return "SMS reading enabled"
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def disableSmsReading():
        try:
            from engine.phone_advanced import phone_advanced
            phone_advanced.stop_sms_monitoring()
            config = get_ui_config()
            config['sms_reading'] = 'disabled'
            save_ui_config(config)
            return "SMS reading disabled"
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def getSmsReadingStatus():
        try:
            config = get_ui_config()
            status = config.get('sms_reading', 'disabled')
            return status.capitalize()
        except Exception as e:
            return "Disabled"
    
    @eel.expose
    def enableCallNotifications():
        try:
            from engine.phone_advanced import phone_advanced
            phone_advanced.start_call_monitoring()
            config = get_ui_config()
            config['call_notifications'] = 'enabled'
            save_ui_config(config)
            return "Call notifications enabled"
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def disableCallNotifications():
        try:
            from engine.phone_advanced import phone_advanced
            phone_advanced.stop_call_monitoring()
            config = get_ui_config()
            config['call_notifications'] = 'disabled'
            save_ui_config(config)
            return "Call notifications disabled"
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def getCallNotificationStatus():
        try:
            config = get_ui_config()
            status = config.get('call_notifications', 'disabled')
            return status.capitalize()
        except Exception as e:
            return "Disabled"
    
    @eel.expose
    def setAIProvider(provider):
        try:
            with open('ai_config.json', 'w') as f:
                json.dump({"ai_provider": provider.lower()}, f)
            return f"AI provider set to {provider}"
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def getAIProvider():
        try:
            with open('ai_config.json', 'r') as f:
                config = json.load(f)
                provider = config.get('ai_provider', 'groq')
                return provider.capitalize()
        except:
            return "Groq"
    
    @eel.expose
    def setResponseStyle(style):
        try:
            from engine.personality_manager import personality_manager
            result = personality_manager.set_response_style(style)
            return result
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def setAIPersonality(personality):
        try:
            from engine.personality_manager import personality_manager
            result = personality_manager.set_personality(personality)
            return result
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def getPersonalitySettings():
        try:
            from engine.personality_manager import personality_manager
            settings = personality_manager.get_current_settings()
            return settings
        except Exception as e:
            return {"response_style": "Professional", "ai_personality": "Formal"}
    
    @eel.expose
    def startContinuousListen():
        try:
            from engine.command import start_continuous_listen
            result = start_continuous_listen()
            return result
        except Exception as e:
            return f"Error: {str(e)}"
    
    @eel.expose
    def stopContinuousListen():
        try:
            from engine.command import stop_continuous_listen
            result = stop_continuous_listen()
            return result
        except Exception as e:
            return f"Error: {str(e)}"
    
    @eel.expose
    def getContinuousListenStatus():
        try:
            from engine.command import get_continuous_listen_status
            result = get_continuous_listen_status()
            return result
        except Exception as e:
            return f"Error: {str(e)}"
    
    @eel.expose
    def enableEmotionDetection():
        try:
            from engine.command import emotion_system
            result = emotion_system.enable()
            return result
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def disableEmotionDetection():
        try:
            from engine.command import emotion_system
            result = emotion_system.disable()
            return result
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def getEmotionStatus():
        try:
            from engine.command import emotion_system
            return emotion_system.get_status()
        except Exception as e:
            return "Error"
    
    @eel.expose
    def getCommandHistory():
        try:
            from engine.command_history import command_history
            return command_history.get_recent_commands(20)
        except Exception as e:
            return []
    
    @eel.expose
    def clearCommandHistory():
        try:
            from engine.command_history import command_history
            command_history.clear_history()
            return "Command history cleared"
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def searchCommands(query="", date_filter="", input_type=""):
        try:
            from engine.command_history import command_history
            return command_history.search_commands(query, date_filter, input_type)
        except Exception as e:
            return []
    
    @eel.expose
    def getCommandStatistics():
        try:
            from engine.command_history import command_history
            return command_history.get_statistics()
        except Exception as e:
            return {"total": 0, "voice": 0, "text": 0, "most_used": [], "success_rate": 0}
    
    @eel.expose
    def getAuthenticatedUserName(user_id):
        """Get user name from users.json based on authenticated user ID"""
        try:
            with open('users.json', 'r') as f:
                users = json.load(f)
                return users.get(str(user_id), "Sir")
        except Exception as e:
            print(f"Error getting user name: {e}")
            return "Sir"
    
    @eel.expose
    def getUserName():
        """Get current user name (fallback function)"""
        try:
            # Try to get the most recent user from users.json
            with open('users.json', 'r') as f:
                users = json.load(f)
                if users:
                    # Return the last added user
                    last_id = max(users.keys(), key=int)
                    return users[last_id]
        except Exception as e:
            print(f"Error getting user name: {e}")
        return "Sir"
    

    
    @eel.expose
    def registerFingerprint():
        """Register fingerprint"""
        try:
            from engine.auth.fingerprint_auth import FingerprintAuth
            auth = FingerprintAuth()
            if auth.register():
                return "Fingerprint registered successfully"
            return "Registration failed"
        except Exception as e:
            return f"Error: {e}"
    
    @eel.expose
    def init():
        try:
            # Try to connect to ADB device with longer timeout
            print("Running device.bat...")
            result = subprocess.run([r'device.bat'], timeout=10)
            if result.returncode == 0:
                print("Device connection successful")
            else:
                print("Device connection failed, continuing without phone control")
        except (subprocess.TimeoutExpired, FileNotFoundError):
            print("ADB connection failed or timed out, continuing without device connection")
        except Exception as e:
            print(f"Device connection error: {e}")
        eel.hideLoader()
        
        # Load saved language and voice settings on startup
        try:
            from engine.multilingual_support import multilingual
            with open('current_language.txt', 'r') as f:
                saved_language = f.read().strip()
                multilingual.current_language = saved_language
                print(f"Language loaded: {saved_language}")
        except Exception as e:
            print(f"Language load error: {e}")
        
        try:
            from engine.voice_gender_control import voice_control
            voice_control.load_config()
            print(f"Voice gender loaded: {voice_control.current_gender}")
        except Exception as e:
            print(f"Voice load error: {e}")
        
        # Load UI settings on startup
        try:
            ui_config = get_ui_config()
            print(f"UI settings loaded: {ui_config}")
            
            # Auto-start phone notifications if enabled
            if ui_config.get('phone_notifications') == 'enabled':
                from engine.phone_notifications import phone_monitor
                phone_monitor.start_monitoring()
            
            # Auto-start SMS and call monitoring if enabled
            if ui_config.get('sms_reading') == 'enabled':
                from engine.phone_advanced import phone_advanced
                phone_advanced.start_sms_monitoring()
            
            if ui_config.get('call_notifications') == 'enabled':
                from engine.phone_advanced import phone_advanced
                phone_advanced.start_call_monitoring()
            
            # Don't auto-start emotion detection - let user control it
                
        except Exception as e:
            print(f"UI settings load error: {e}")
        
        # Start phone monitoring if enabled
        try:
            config = get_ui_config()
            if config.get('phone_notifications') == 'enabled':
                from engine.phone_notifications import phone_monitor
                if not phone_monitor.monitoring:
                    phone_monitor.start_monitoring()
        except Exception as e:
            pass
        
        # Dual biometric authentication
        config = get_biometric_config()
        face_enabled = config.get('face_auth_enabled', False)
        fingerprint_enabled = config.get('fingerprint_auth_enabled', True)
        
        face_passed = False
        fingerprint_passed = False
        
        # Face authentication
        authenticated_user_id = None
        if face_enabled:
            speak("Ready for Face Authentication")
            result = recoganize.AuthenticateFace()
            if isinstance(result, tuple):
                flag, authenticated_user_id = result
            else:
                flag = result
            if flag == 1:
                face_passed = True
                speak("Face Authentication Successful")
            else:
                speak("Face authentication failed")
        
        # Fingerprint authentication
        if fingerprint_enabled:
            speak("Ready for Fingerprint Authentication")
            if AuthenticateFingerprint():
                fingerprint_passed = True
                speak("Fingerprint Authentication Successful")
            else:
                speak("Fingerprint authentication failed")
        
        # Check results
        if face_enabled and fingerprint_enabled:
            # Both required
            if face_passed and fingerprint_passed:
                speak("Dual Authentication Successful")
                success = True
            else:
                speak("Dual authentication failed. Access denied.")
                success = False
        elif face_enabled:
            # Face only
            success = face_passed
        elif fingerprint_enabled:
            # Fingerprint only
            success = fingerprint_passed
        else:
            # No authentication enabled
            speak("No authentication enabled, starting Jarvis")
            success = True
        
        if success:
            eel.hideFaceAuth()
            eel.hideFaceAuthSuccess()
            
            # Update UI with authenticated user name
            if authenticated_user_id:
                try:
                    eel.updateUserAfterAuth(authenticated_user_id)
                except:
                    pass
            
            # Don't auto-start emotion detection - let user control it
            greeting = get_context_aware_greeting(authenticated_user_id)
            
            speak(greeting)
            eel.hideStart()
            playAssistantSound()
        else:
            exit()
    @eel.expose
    def chatbot_chat(message, provider='auto', model=None):
        try:
            import os
            import sys
            original_cwd = os.getcwd()
            chatbot_path = os.path.join(original_cwd, 'chatgpt_clone')
            
            os.chdir(chatbot_path)
            if chatbot_path not in sys.path:
                sys.path.insert(0, chatbot_path)
            
            import importlib.util
            spec = importlib.util.spec_from_file_location("app", "app.py")
            app = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(app)
            ai_manager = app.ai_manager
            response = ai_manager.get_response(message, provider, model)
            
            os.chdir(original_cwd)
            return {'response': response}
        except Exception as e:
            try:
                os.chdir(original_cwd)
            except:
                pass
            return {'error': str(e)}
    
    # Add HTTP route for voice input
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    flask_app = Flask(__name__)
    CORS(flask_app)
    
    @flask_app.route('/chatbot_listen', methods=['POST', 'OPTIONS'])
    def chatbot_listen_http():
        if request.method == 'OPTIONS':
            response = jsonify({})
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
            response.headers.add('Access-Control-Allow-Methods', 'POST')
            return response
            
        try:
            import speech_recognition as sr
            r = sr.Recognizer()
            with sr.Microphone() as source:
                print('Chatbot listening....')
                r.pause_threshold = 1
                r.adjust_for_ambient_noise(source)
                
                try:
                    audio = r.listen(source, timeout=8, phrase_time_limit=4)
                except sr.WaitTimeoutError:
                    print("Chatbot listening timeout - no speech detected")
                    return ""
            
            try:
                print('Chatbot recognizing...')
                query = r.recognize_google(audio, language='en-IN')
                if query and query.strip():
                    print(f"Chatbot recognized: {query}")
                    return query
                else:
                    print("Chatbot recognition: empty result")
                    return ""
            except sr.UnknownValueError:
                print("Chatbot recognition: could not understand audio")
                return ""
            except sr.RequestError as e:
                print(f"Chatbot recognition service error: {e}")
                return ""
            except Exception as e:
                print(f"Chatbot recognition error: {e}")
                return ""
        except Exception as e:
            print(f"Chatbot voice error: {e}")
            return ""
    
    # Start Flask server in background
    import threading
    def run_flask():
        try:
            print("Starting Flask server on port 8001...")
            flask_app.run(host='localhost', port=8001, debug=False, use_reloader=False)
        except Exception as e:
            print(f"Flask server error: {e}")
    
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
    print("Flask thread started for chatbot voice input")
    

    
    os.system('start msedge.exe --app="http://localhost:8000/index.html"')

    eel.start('index.html', mode=None, host='localhost', block=True)