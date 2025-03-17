import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';

interface ConfirmVerificationProps {
    onConfirm: () => void;
    onDecline: () => void;
    confirmText?: string;
    declineText?: string;
}

export const ConfirmVerification = ({
    onConfirm,
    onDecline,
    confirmText = 'Confirm',
    declineText = 'Decline',
}: ConfirmVerificationProps) => {
    return (
        <View style={styles.buttonContainer}>
            <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={onDecline}
            >
                <Text style={styles.buttonText}>{declineText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={onConfirm}
            >
                <Text style={styles.buttonText}>{confirmText}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    buttonContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmButton: {
        backgroundColor: '#4CAF50',
    },
    rejectButton: {
        backgroundColor: '#FF4B4B',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 