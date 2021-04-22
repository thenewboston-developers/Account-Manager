import {useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useParams} from 'react-router-dom';
import {Bank, ConfirmationValidator} from 'thenewboston';

import {getCrawlSockets} from '@renderer/selectors';
import {toggleCrawlProcess} from '@renderer/store/sockets';
import {
  AddressParams,
  AppDispatch,
  CrawlStatus,
  ManagedNode,
  NodeCrawlStatusWithAddress,
  NodeType,
} from '@renderer/types';
import {generateUuid} from '@renderer/utils/local';
import {displayToast} from '@renderer/utils/toast';
import {formatAddress} from '@renderer/utils/address';

import useAddress from './useAddress';

const useNetworkCrawlFetcher = (
  managedNode: ManagedNode | undefined,
  crawlingIsEnabled: boolean,
): {
  crawlLastCompleted: string;
  crawlStatus: CrawlStatus | null;
  handleCrawlClick: () => Promise<void>;
  loadingCrawl: boolean;
  submittingCrawl: boolean;
} => {
  const {ipAddress, port: portStr, protocol} = useParams<AddressParams>();
  const port = parseInt(portStr, 10);
  const address = useAddress();
  const dispatch = useDispatch<AppDispatch>();
  const crawlSockets = useSelector(getCrawlSockets);
  const [crawlLastCompleted, setCrawlLastCompleted] = useState<string>('');
  const [crawlStatus, setCrawlStatus] = useState<CrawlStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const socketEntry = Object.entries(crawlSockets).find(
    (e) => formatAddress(e[1].ip_address, e[1].port, e[1].protocol) === address,
  );
  const crawlSocket = socketEntry ? crawlSockets[socketEntry[0]] : null;

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);

        let node: Bank | ConfirmationValidator;
        node = new Bank(address);
        const nodeConfig = await node.getConfig();

        if (nodeConfig.node_type === NodeType.confirmationValidator) {
          node = new ConfirmationValidator(address);
        }

        const data = (await node.getCrawlStatus()) as NodeCrawlStatusWithAddress;

        setCrawlStatus(data.crawl_status || CrawlStatus.notCrawling);
        setCrawlLastCompleted(data.crawl_last_completed);
      } catch (error) {
        displayToast('An error occurred when getting crawl status');
      } finally {
        setLoading(false);
      }
    };

    if (crawlingIsEnabled) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [address, crawlingIsEnabled]);

  useEffect(() => {
    if (!crawlSocket) return;
    if (crawlSocket.crawl_status !== crawlStatus) {
      setCrawlStatus(crawlSocket.crawl_status);
      setCrawlLastCompleted(crawlSocket.crawl_last_completed);
    }
  }, [crawlSocket, crawlSocket?.crawl_status, crawlStatus]);

  const handleClick = useCallback(async (): Promise<void> => {
    if (!managedNode?.account_signing_key) return;

    setSubmitting(true);
    if (crawlStatus === CrawlStatus.notCrawling || crawlStatus === CrawlStatus.crawling) {
      const id = (socketEntry && socketEntry[0]) || generateUuid();
      dispatch(
        toggleCrawlProcess({
          crawlStatus,
          id,
          ip_address: ipAddress,
          port,
          protocol,
          signingKey: managedNode.nid_signing_key,
        }),
      );
    }
    setSubmitting(false);
  }, [
    crawlStatus,
    dispatch,
    ipAddress,
    managedNode?.account_signing_key,
    managedNode?.nid_signing_key,
    port,
    protocol,
    socketEntry,
  ]);

  return {
    crawlLastCompleted,
    crawlStatus,
    handleCrawlClick: handleClick,
    loadingCrawl: loading,
    submittingCrawl: submitting,
  };
};

export default useNetworkCrawlFetcher;
