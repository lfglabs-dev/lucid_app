import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useStore } from '../store/useStore';

export const SettingsScreen = () => {
    const { settings, toggleSafeHashCheck, toggleLedgerHashCheck, removePairedDevice } = useStore();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Clear Signing</Text>
                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Enable Safe hash Check</Text>
                    <Switch
                        value={settings.safeHashCheckEnabled}
                        onValueChange={toggleSafeHashCheck}
                    />
                </View>
                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Enable Ledger hash Check</Text>
                    <Switch
                        value={settings.ledgerHashCheckEnabled}
                        onValueChange={toggleLedgerHashCheck}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Paired Devices</Text>
                {settings.pairedDevices.map((device) => (
                    <View key={device.id} style={styles.deviceRow}>
                        <View style={styles.deviceInfo}>
                            <Text style={styles.deviceName}>{device.name}</Text>
                            <Text style={styles.deviceDate}>
                                Last connected: {new Date(device.lastConnected).toLocaleDateString()}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => removePairedDevice(device.id)}
                            style={styles.removeButton}
                        >
                            <Text style={styles.removeButtonText}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About Lucid</Text>
                <Text style={styles.aboutText}>
                    Lucid is a transaction verification mobile app that helps you simulate and verify
                    your blockchain transactions before signing them.
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    settingLabel: {
        fontSize: 16,
    },
    deviceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    deviceDate: {
        fontSize: 14,
        color: '#666',
    },
    removeButton: {
        padding: 8,
    },
    removeButtonText: {
        color: '#FF3B30',
        fontSize: 16,
    },
    aboutText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
    },
}); 