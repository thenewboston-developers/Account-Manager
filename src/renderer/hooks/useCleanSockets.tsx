import {useCallback, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Account, Bank, ConfirmationValidator} from 'thenewboston';

import {getInactiveCleanSockets} from '@renderer/selectors/sockets';
import {
  AppDispatch,
  CleanSocketState,
  CleanStatus,
  NodeCleanStatusWithAddress,
  NodeType,
  SocketConnectionStatus,
} from '@renderer/types';
import {formatAddressFromNode, formatSocketAddressFromNode} from '@renderer/utils/address';
import {initializeSocketForCleanStatus} from '@renderer/utils/sockets';
import handleCleanSocketEvent from '@renderer/utils/sockets/clean';
import {displayErrorToast} from '@renderer/utils/toast';
import {updateCleanProcess} from '@renderer/store/sockets';

const useCleanSockets = (): void => {
  const dispatch = useDispatch<AppDispatch>();
  const inactiveCleanSockets = useSelector(getInactiveCleanSockets);

  const fetchCleanData = useCallback(
    async (cleanSocket: CleanSocketState): Promise<void> => {
      try {
        const address = formatAddressFromNode(cleanSocket);
        const socketAddress = formatSocketAddressFromNode(cleanSocket);
        const socketNetworkId = new Account(cleanSocket.signingKey);

        let node: Bank | ConfirmationValidator;
        node = new Bank(address);
        const nodeConfig = await node.getConfig();

        if (nodeConfig.node_type === NodeType.confirmationValidator) {
          node = new ConfirmationValidator(address);
        }

        const inCleaning = cleanSocket.clean_status === CleanStatus.cleaning;

        const data = inCleaning
          ? ((await node.stopClean(socketNetworkId)) as NodeCleanStatusWithAddress)
          : ((await node.startClean(socketNetworkId)) as NodeCleanStatusWithAddress);

        dispatch(
          updateCleanProcess({
            clean_last_completed: data.clean_last_completed,
            clean_status: data.clean_status,
            id: cleanSocket.id,
          }),
        );
        if (data.clean_status === CleanStatus.cleaning || data.clean_status === CleanStatus.stopRequested) {
          const socket = initializeSocketForCleanStatus(socketAddress);
          socket.onmessage = (event) => {
            handleCleanSocketEvent(cleanSocket.id, dispatch, event);
            socket.close();
          };
        }
      } catch (error) {
        dispatch(
          updateCleanProcess({
            clean_last_completed: cleanSocket.clean_last_completed,
            clean_status: cleanSocket.clean_status || CleanStatus.notCleaning,
            connectionStatus: SocketConnectionStatus.failed,
            id: cleanSocket.id,
          }),
        );
        displayErrorToast(error);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (inactiveCleanSockets.length) {
      inactiveCleanSockets.forEach((cleanSocket) => fetchCleanData(cleanSocket));
    }
  }, [fetchCleanData, inactiveCleanSockets]);
};

export default useCleanSockets;
