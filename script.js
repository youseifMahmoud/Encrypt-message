document.addEventListener('DOMContentLoaded', function() {
    // استدعاء العناصر من واجهة المستخدم
    const encryptionTypeSelect = document.getElementById('encryptionType');
    const inputTextarea = document.getElementById('input');
    const keySection = document.getElementById('keySection');
    const keyInput = document.getElementById('key');
    const encryptBtn = document.getElementById('encryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const outputDiv = document.getElementById('output');
    const copyBtn = document.getElementById('copyBtn');
    
    /* 
     * مستمع حدث لتغيير نوع التشفير
     * يتحكم في ظهور/إخفاء حقل المفتاح بناءً على نوع التشفير المختار
     */
    encryptionTypeSelect.addEventListener('change', function() {
        const selectedValue = this.value;
        if (selectedValue === 'caesar' || selectedValue === 'vigenere') {
            keySection.style.display = 'block';
            
            if (selectedValue === 'caesar') {
                keyInput.type = 'number';
                keyInput.placeholder = 'أدخل عدد الإزاحة (1-25)';
            } else {
                keyInput.type = 'text';
                keyInput.placeholder = 'أدخل كلمة المفتاح';
            }
        } else {
            keySection.style.display = 'none';
        }
    });
    
    /* 
     * كائن يحتوي على جميع خوارزميات التشفير وفك التشفير
     * كل خوارزمية لها دالتان: encrypt للتشفير و decrypt لفك التشفير
     */
    const encryptionFunctions = {
        // Base64 Encoding - ترميز البيانات النصية إلى سلسلة من 64 حرفًا
        base64: {
            // دالة التشفير: تحويل النص العادي إلى ترميز Base64
            encrypt: function(text) {
                // استخدام encodeURIComponent لدعم الأحرف الخاصة والعربية
                return btoa(unescape(encodeURIComponent(text)));
            },
            // دالة فك التشفير: تحويل ترميز Base64 إلى النص الأصلي
            decrypt: function(encoded) {
                try {
                    return decodeURIComponent(escape(atob(encoded)));
                } catch (e) {
                    return "خطأ في فك التشفير. تأكد من أن النص مشفر بشكل صحيح بـ Base64.";
                }
            }
        },
        
        // Caesar Cipher - شفرة قيصر: إزاحة كل حرف بعدد معين من المواضع
        caesar: {
            // دالة التشفير: إزاحة كل حرف بمقدار shift
            encrypt: function(text, shift) {
                // إذا لم يتم تحديد قيمة الإزاحة، استخدم 3 كقيمة افتراضية
                if (!shift) shift = 3;
                // تحويل قيمة الإزاحة إلى عدد صحيح وضمان أنها ضمن نطاق 0-25
                shift = parseInt(shift) % 26;
                
                // تقسيم النص إلى أحرف، ومعالجة كل حرف على حدة، ثم إعادة دمجها
                return text.split('').map(char => {
                    const code = char.charCodeAt(0);
                    
                    // الأحرف الكبيرة (A-Z: 65-90)
                    if (code >= 65 && code <= 90) {
                        return String.fromCharCode(((code - 65 + shift) % 26) + 65);
                    }
                    // الأحرف الصغيرة (a-z: 97-122)
                    else if (code >= 97 && code <= 122) {
                        return String.fromCharCode(((code - 97 + shift) % 26) + 97);
                    }
                    // الأحرف غير الأبجدية تبقى كما هي
                    else {
                        return char;
                    }
                }).join('');
            },
            // دالة فك التشفير: إزاحة كل حرف في الاتجاه المعاكس
            decrypt: function(text, shift) {
                if (!shift) shift = 3;
                shift = parseInt(shift) % 26;
                
                // لفك التشفير، نقوم بالإزاحة في الاتجاه المعاكس (26 - shift)
                return this.encrypt(text, 26 - shift);
            }
        },
        
        // Vigenère Cipher - شفرة فيجنير: استخدام كلمة مفتاح لتشفير النص
        vigenere: {
            // دالة التشفير: استخدام كلمة مفتاح لتشفير النص
            encrypt: function(text, key) {
                if (!key) return "يرجى إدخال كلمة المفتاح";
                
                let result = "";
                let keyIndex = 0;
                
                // معالجة كل حرف من النص الأصلي
                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    const code = char.charCodeAt(0);
                    
                    // معالجة الأحرف الأبجدية فقط
                    if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
                        const isUpperCase = (code >= 65 && code <= 90);
                        const plainCharCode = isUpperCase ? code - 65 : code - 97;
                        
                        // الحصول على حرف المفتاح الحالي وقيمة الإزاحة الخاصة به
                        const keyChar = key[keyIndex % key.length].toUpperCase();
                        const keyShift = keyChar.charCodeAt(0) - 65;
                        
                        // تطبيق تشفير فيجنير
                        const encryptedCharCode = (plainCharCode + keyShift) % 26;
                        
                        // تحويل الرمز المشفر إلى حرف
                        result += isUpperCase 
                            ? String.fromCharCode(encryptedCharCode + 65) 
                            : String.fromCharCode(encryptedCharCode + 97);
                        
                        keyIndex++;
                    } else {
                        // الأحرف غير الأبجدية تبقى كما هي
                        result += char;
                    }
                }
                
                return result;
            },
            // دالة فك التشفير: استخدام كلمة المفتاح لفك تشفير النص
            decrypt: function(text, key) {
                if (!key) return "يرجى إدخال كلمة المفتاح";
                
                let result = "";
                let keyIndex = 0;
                
                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    const code = char.charCodeAt(0);
                    
                    // معالجة الأحرف الأبجدية فقط
                    if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
                        const isUpperCase = (code >= 65 && code <= 90);
                        const encryptedCharCode = isUpperCase ? code - 65 : code - 97;
                        
                        // الحصول على حرف المفتاح الحالي وقيمة الإزاحة الخاصة به
                        const keyChar = key[keyIndex % key.length].toUpperCase();
                        const keyShift = keyChar.charCodeAt(0) - 65;
                        
                        // تطبيق فك تشفير فيجنير (إضافة 26 لضمان نتيجة موجبة)
                        const plainCharCode = (encryptedCharCode - keyShift + 26) % 26;
                        
                        // تحويل الرمز المفكوك تشفيره إلى حرف
                        result += isUpperCase 
                            ? String.fromCharCode(plainCharCode + 65) 
                            : String.fromCharCode(plainCharCode + 97);
                        
                        keyIndex++;
                    } else {
                        // الأحرف غير الأبجدية تبقى كما هي
                        result += char;
                    }
                }
                
                return result;
            }
        },
        
        // Morse Code - شفرة مورس: تحويل الأحرف إلى نقاط وشرطات
        morse: {
            // قاموس رموز مورس
            morseCodeMap: {
                'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
                'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
                'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..',
                '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
                '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...',
                ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
                ' ': '/'
            },
            
            // دالة التشفير: تحويل النص إلى شفرة مورس
            encrypt: function(text) {
                return text.toUpperCase().split('').map(char => {
                    return this.morseCodeMap[char] || char;
                }).join(' ');
            },
            
            // دالة فك التشفير: تحويل شفرة مورس إلى نص
            decrypt: function(morse) {
                // إنشاء خريطة عكسية لفك التشفير
                const reverseMorseMap = {};
                for (const [key, value] of Object.entries(this.morseCodeMap)) {
                    reverseMorseMap[value] = key;
                }
                
                return morse.split(' ').map(code => {
                    return reverseMorseMap[code] || code;
                }).join('');
            }
        },
        
        // Binary - ثنائي: تحويل النص إلى أرقام ثنائية (0 و 1)
        binary: {
            // دالة التشفير: تحويل النص إلى ترميز ثنائي
            encrypt: function(text) {
                return text.split('').map(char => {
                    // تحويل كل حرف إلى رمزه الثنائي (8 بت)
                    return char.charCodeAt(0).toString(2).padStart(8, '0');
                }).join(' ');
            },
            
            // دالة فك التشفير: تحويل الترميز الثنائي إلى نص
            decrypt: function(binary) {
                return binary.split(' ').map(bin => {
                    // تحويل كل رمز ثنائي إلى الحرف المقابل له
                    return String.fromCharCode(parseInt(bin, 2));
                }).join('');
            }
        },
        
        // Hexadecimal - سداسي عشر: تحويل النص إلى أرقام سداسية عشرية
        hex: {
            // دالة التشفير: تحويل النص إلى ترميز سداسي عشري
            encrypt: function(text) {
                return text.split('').map(char => {
                    // تحويل كل حرف إلى رمزه السداسي العشري
                    return char.charCodeAt(0).toString(16).padStart(2, '0');
                }).join(' ');
            },
            
            // دالة فك التشفير: تحويل الترميز السداسي العشري إلى نص
            decrypt: function(hex) {
                return hex.split(' ').map(h => {
                    // تحويل كل رمز سداسي عشري إلى الحرف المقابل له
                    return String.fromCharCode(parseInt(h, 16));
                }).join('');
            }
        },
        
        // Reverse Text - نص معكوس: عكس ترتيب الأحرف في النص
        reverse: {
            // دالة التشفير: عكس ترتيب الأحرف
            encrypt: function(text) {
                return text.split('').reverse().join('');
            },
            
            // دالة فك التشفير: عكس ترتيب الأحرف مرة أخرى للحصول على النص الأصلي
            decrypt: function(text) {
                return this.encrypt(text); // عكس النص مرة أخرى يعيد النص الأصلي
            }
        },
        
        // ROT13 - دوران بمقدار 13: إزاحة كل حرف بمقدار 13 موضعًا
        rot13: {
            // دالة التشفير: إزاحة كل حرف بمقدار 13 موضعًا
            encrypt: function(text) {
                return text.replace(/[a-zA-Z]/g, function(char) {
                    const code = char.charCodeAt(0);
                    const isUpperCase = (code >= 65 && code <= 90);
                    const offset = isUpperCase ? 65 : 97;
                    
                    // تطبيق تحويل ROT13
                    return String.fromCharCode(((code - offset + 13) % 26) + offset);
                });
            },
            
            // دالة فك التشفير: إزاحة كل حرف بمقدار 13 موضعًا مرة أخرى
            decrypt: function(text) {
                return this.encrypt(text); // ROT13 هو عكس نفسه
            }
        },
        
        // URL Encoding - ترميز URL: تشفير النص ليكون آمنًا للاستخدام في عناوين URL
        url: {
            // دالة التشفير: ترميز النص بتنسيق URL
            encrypt: function(text) {
                return encodeURIComponent(text);
            },
            
            // دالة فك التشفير: فك ترميز النص المشفر بتنسيق URL
            decrypt: function(text) {
                try {
                    return decodeURIComponent(text);
                } catch (e) {
                    return "خطأ في فك التشفير. تأكد من أن النص مشفر بشكل صحيح.";
                }
            }
        }
    };
    
    /* 
     * مستمع حدث لزر التشفير
     * يقوم بتشفير النص المدخل باستخدام الخوارزمية المختارة
     */
    encryptBtn.addEventListener('click', function() {
        const text = inputTextarea.value;
        if (!text) {
            outputDiv.textContent = "يرجى إدخال نص للتشفير";
            return;
        }
        
        const encryptionType = encryptionTypeSelect.value;
        const key = keyInput.value;
        
        const encryptionFunction = encryptionFunctions[encryptionType];
        if (encryptionFunction) {
            outputDiv.textContent = encryptionFunction.encrypt(text, key);
        } else {
            outputDiv.textContent = "نوع التشفير غير مدعوم";
        }
    });
    
    /* 
     * مستمع حدث لزر فك التشفير
     * يقوم بفك تشفير النص المدخل باستخدام الخوارزمية المختارة
     */
    decryptBtn.addEventListener('click', function() {
        const text = inputTextarea.value;
        if (!text) {
            outputDiv.textContent = "يرجى إدخال نص لفك التشفير";
            return;
        }
        
        const encryptionType = encryptionTypeSelect.value;
        const key = keyInput.value;
        
        const encryptionFunction = encryptionFunctions[encryptionType];
        if (encryptionFunction) {
            outputDiv.textContent = encryptionFunction.decrypt(text, key);
        } else {
            outputDiv.textContent = "نوع التشفير غير مدعوم";
        }
    });
    
    /* 
     * مستمع حدث لزر النسخ
     * ينسخ النص الناتج إلى الحافظة
     */
    copyBtn.addEventListener('click', function() {
        const outputText = outputDiv.textContent;
        if (!outputText) return;
        
        // إنشاء عنصر textarea مؤقت لنسخ النص
        const textarea = document.createElement('textarea');
        textarea.value = outputText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        // تغيير نص الزر مؤقتًا
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "تم النسخ!";
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    });
});
