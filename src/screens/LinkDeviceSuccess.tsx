import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinkStackParamList, RootTabParamList } from '../navigation/AppNavigator';

type NavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<LinkStackParamList, 'LinkDeviceSuccess'>,
    BottomTabNavigationProp<RootTabParamList>
>;

type Props = NativeStackScreenProps<LinkStackParamList, 'LinkDeviceSuccess'>;

export const LinkDeviceSuccess = ({ route }: Props) => {
    const { title, deviceName } = route.params;
    const navigation = useNavigation<NavigationProp>();
    const hasNavigated = useRef(false);

    useEffect(() => {
        // Auto navigate to transactions after 3 seconds
        const timer = setTimeout(() => {
            if (!hasNavigated.current) {
                hasNavigated.current = true;
                // Navigate to the Transactions tab
                navigation.getParent()?.reset({
                    index: 1, // Index 1 is the Transactions tab
                    routes: [
                        { name: 'Link' },
                        { name: 'Transactions' },
                        { name: 'Settings' }
                    ],
                });
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigation]);


    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <LottieView
                    source={require('../../assets/verifiedLottie.json')}
                    autoPlay
                    loop={false}
                    style={styles.animation}
                />
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.deviceName}>{deviceName}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    animation: {
        width: 200,
        height: 200,
    },
    title: {
        color: '#000',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'center',
    },
    deviceName: {
        color: '#56CA77', // Green color matching the animation
        fontSize: 18,
        marginTop: 10,
        textAlign: 'center',
    },
});

