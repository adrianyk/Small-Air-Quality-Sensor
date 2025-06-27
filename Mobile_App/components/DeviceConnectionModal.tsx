import { FC, useCallback } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Modal,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Device } from "react-native-ble-plx";
import { Feather } from '@expo/vector-icons';

import ThemedView from "@/components/ThemedView";
import ThemedText from "@/components/ThemedText";
import Spacer from "@/components/Spacer";

type DeviceModalListItemProps = {
  item: ListRenderItemInfo<Device>;
  connectToPeripheral: (device: Device) => void;
  closeModal: () => void;
};

type DeviceModalProps = {
  devices: Device[];
  visible: boolean;
  connectToPeripheral: (device: Device) => void;
  closeModal: () => void;
  refreshDevices: () => void;
};

const DeviceModalListItem: FC<DeviceModalListItemProps> = (props) => {
  const { item, connectToPeripheral, closeModal } = props;

  const connectAndCloseModal = useCallback(() => {
    connectToPeripheral(item.item);
    closeModal();
  }, [closeModal, connectToPeripheral, item.item]);

  return (
    <TouchableOpacity
      onPress={connectAndCloseModal}
      className="bg-[#FF6060] justify-center items-center h-12 mx-5 mb-1 rounded-md"
    >
      <Text className="text-lg font-bold text-white">{item.item.name}</Text>
    </TouchableOpacity>
  );
};

const DeviceModal: FC<DeviceModalProps> = (props) => {
  const { devices, visible, connectToPeripheral, closeModal } = props;

  const renderDeviceModalListItem = useCallback(
    (item: ListRenderItemInfo<Device>) => {
      return (
        <DeviceModalListItem
          item={item}
          connectToPeripheral={connectToPeripheral}
          closeModal={closeModal}
        />
      );
    },
    [closeModal, connectToPeripheral]
  );

  return (
    <Modal
      className="flex-1 bg-[#f2f2f2]"
      animationType="slide"
      transparent={false}
      visible={visible}
    >
      <ThemedView className="flex-1">
        <TouchableOpacity onPress={closeModal} style={modalStyle.backButton}>
          <Feather name="arrow-left" size={24} color="#007AFF" />
        </TouchableOpacity>

        <ThemedText className="mt-10 text-[30px] font-bold mx-5 text-center">
          Tap on a device to connect
        </ThemedText>

        <Spacer height={20} />
        <TouchableOpacity
          style={modalStyle.ctaButton}
          onPress={props.refreshDevices}
        >
          <Text className="text-lg font-bold text-white">Refresh</Text>
        </TouchableOpacity>
        
        <FlatList
          contentContainerStyle={modalStyle.modalFlatlistContiner}
          data={devices}
          renderItem={renderDeviceModalListItem}
        />
      </ThemedView>
    </Modal>
  );
};

const modalStyle = StyleSheet.create({
  modalFlatlistContiner: {
    flex: 1,
    justifyContent: "center",
  },
  ctaButton: {
    backgroundColor: "#FF6060",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    marginHorizontal: 20,
    marginBottom: 5,
    borderRadius: 8,
  },
  backButton: {
    alignSelf: "flex-start",
    marginLeft: 16,
    marginBottom: 12,
    padding: 8,
  }
});

export default DeviceModal;
