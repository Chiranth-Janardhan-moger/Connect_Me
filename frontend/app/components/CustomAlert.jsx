// components/CustomAlert.jsx - Modern replacement for Alert.alert
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

let alertRef = null;

const CustomAlert = () => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [buttons, setButtons] = useState([]);
  const [type, setType] = useState('info'); // info, success, warning, error

  useEffect(() => {
    alertRef = {
      show: (alertTitle, alertMessage, alertButtons = [], alertType = 'info') => {
        setTitle(alertTitle);
        setMessage(alertMessage);
        setType(alertType);
        
        if (alertButtons.length === 0) {
          // Default OK button
          setButtons([{
            text: 'OK',
            onPress: () => {},
            style: 'default',
          }]);
        } else {
          setButtons(alertButtons);
        }
        
        setVisible(true);
      },
      hide: () => {
        setVisible(false);
      },
    };
  }, []);

  const handleButtonPress = (button) => {
    if (button.onPress) {
      button.onPress();
    }
    setVisible(false);
  };

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          color: '#10b981',
          bgColor: '#ecfdf5',
          borderColor: '#a7f3d0',
        };
      case 'warning':
        return {
          icon: 'warning',
          color: '#f59e0b',
          bgColor: '#fffbeb',
          borderColor: '#fde68a',
        };
      case 'error':
        return {
          icon: 'alert-circle',
          color: '#ef4444',
          bgColor: '#fef2f2',
          borderColor: '#fecaca',
        };
      default:
        return {
          icon: 'information-circle',
          color: '#3b82f6',
          bgColor: '#eff6ff',
          borderColor: '#bfdbfe',
        };
    }
  };

  const iconConfig = getIconAndColor();

  const getButtonStyle = (style) => {
    switch (style) {
      case 'cancel':
        return styles.cancelButton;
      case 'destructive':
        return styles.destructiveButton;
      default:
        return styles.defaultButton;
    }
  };

  const getButtonTextStyle = (style) => {
    switch (style) {
      case 'cancel':
        return styles.cancelButtonText;
      case 'destructive':
        return styles.destructiveButtonText;
      default:
        return styles.defaultButtonText;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setVisible(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: iconConfig.bgColor, borderColor: iconConfig.borderColor }]}>
              <Ionicons name={iconConfig.icon} size={48} color={iconConfig.color} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.button, getButtonStyle(button.style)]}
                onPress={() => handleButtonPress(button)}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, getButtonTextStyle(button.style)]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Global alert function
export const showCustomAlert = (title, message, buttons = [], type = 'info') => {
  if (alertRef) {
    alertRef.show(title, message, buttons, type);
  }
};

// Convenience methods
export const showSuccessAlert = (title, message, onOk = null) => {
  showCustomAlert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : [], 'success');
};

export const showErrorAlert = (title, message, onOk = null) => {
  showCustomAlert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : [], 'error');
};

export const showWarningAlert = (title, message, onOk = null) => {
  showCustomAlert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : [], 'warning');
};

export const showInfoAlert = (title, message, onOk = null) => {
  showCustomAlert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : [], 'info');
};

export const showConfirmAlert = (title, message, onConfirm = null, onCancel = null) => {
  const buttons = [
    { text: 'Cancel', onPress: onCancel, style: 'cancel' },
    { text: 'Confirm', onPress: onConfirm, style: 'default' },
  ];
  showCustomAlert(title, message, buttons, 'warning');
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    width: width - 60,
    maxWidth: 420,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 32,
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  defaultButton: {
    backgroundColor: '#2563eb',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  destructiveButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  defaultButtonText: {
    color: '#fff',
  },
  cancelButtonText: {
    color: '#374151',
  },
  destructiveButtonText: {
    color: '#fff',
  },
});

export default CustomAlert;
