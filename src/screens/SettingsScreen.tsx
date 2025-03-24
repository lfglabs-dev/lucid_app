import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ClearSigningSection } from '../components/settings/ClearSigningSection';
import { LinkedDevicesSection } from '../components/settings/LinkedDevicesSection';
import { AboutSection } from '../components/settings/AboutSection';

export const SettingsScreen = () => {
    return (
        <ScrollView style={styles.container}>
            <ClearSigningSection />
            <LinkedDevicesSection />
            <AboutSection />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
}); 