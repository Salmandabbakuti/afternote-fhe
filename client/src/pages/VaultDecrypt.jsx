import { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link, useParams } from "@tanstack/react-router";
import { FheTypes } from "@cofhe/sdk";
import {
  useAppKitAccount,
  useAppKitProvider,
  useAppKit
} from "@reown/appkit/react";
import { BrowserProvider, toBeArray } from "ethers";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  Input,
  Result,
  Skeleton,
  Space,
  Tag,
  Typography,
  App as AntdApp
} from "antd";
import { LockOutlined, ArrowRightOutlined } from "@ant-design/icons";
import {
  bigIntToUint8Array,
  decryptText,
  getCofheClient,
  hexToUint8Array,
  subgraphClient,
  ellipsisString
} from "@/utils";
import {
  GET_DECRYPTABLE_VAULTS_QUERY,
  SEPOLIA_CHAIN_ID
} from "@/utils/constants";
import { getVaultMetadata } from "@/utils/vaultUtils";

dayjs.extend(relativeTime);

const { Paragraph, Text, Title } = Typography;

function formatTimestamp(timestamp) {
  return dayjs.unix(timestamp).format("MMM D, YYYY h:mm A");
}

export default function VaultDecrypt() {
  const [vault, setVault] = useState(null);
  const [loading, setLoading] = useState({
    read: true,
    decrypt: false
  });
  const [decryptedNote, setDecryptedNote] = useState("");

  const { id } = useParams({ from: "/vaults/$id/decrypt" });
  const { isConnected, address: account, caipAddress } = useAppKitAccount();
  // caipAddress format: eip155:<chainid>:<address>
  const selectedChainId = caipAddress?.split(":")[1];
  const { open } = useAppKit();
  const { walletProvider } = useAppKitProvider("eip155");
  const { message } = AntdApp.useApp();

  async function handleGetDecryptableVault() {
    if (!account) {
      setVault(null);
      return;
    }
    try {
      setLoading((prev) => ({ ...prev, read: true }));
      const data = await subgraphClient.request(GET_DECRYPTABLE_VAULTS_QUERY, {
        first: 1,
        skip: 0,
        where: {
          id: id,
          isReleased: true,
          beneficiaries_contains: [account.toLowerCase()]
        }
      });
      setVault(data?.vaults[0] || null);
    } catch (error) {
      console.error("Failed to fetch vault details:", error);
      message.error("Failed to get vault details. Please try again later.");
    } finally {
      setLoading((prev) => ({ ...prev, read: false }));
    }
  }

  useEffect(() => {
    handleGetDecryptableVault();
  }, [account]);

  // if is not connected return result with connect button
  if (!isConnected) {
    return (
      <Result
        status="403"
        title="Sign In to continue"
        subTitle="You're almost there! Sign In with the wallet that was added as a beneficiary to decrypt this message"
        extra={[
          <Button
            key="connect"
            shape="round"
            type="primary"
            onClick={() => open({ view: "Connect" })}
          >
            Connect Wallet
          </Button>
        ]}
      />
    );
  }

  if (loading.read) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    );
  }

  if (!loading.read && !vault) {
    return (
      <Result
        status="404"
        title="Vault not found"
        subTitle="This vault may be unavailable, or you may not have permission to view it. Please try again in a moment"
        extra={[
          <Link to="/" key="home">
            <Button shape="round" key="home">
              Go Home
            </Button>
          </Link>,
          <Button
            shape="round"
            key="try-again"
            type="primary"
            onClick={handleGetDecryptableVault}
          >
            Try Again
          </Button>
        ]}
      />
    );
  }

  const vaultMetadata = getVaultMetadata(vault);

  async function handleDecrypt() {
    if (!isConnected || !walletProvider) {
      return message.error("Please connect your wallet first.");
    }
    if (selectedChainId !== SEPOLIA_CHAIN_ID) {
      return message.error("Please switch to Sepolia network.");
    }

    try {
      setLoading((prev) => ({ ...prev, decrypt: true }));

      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      const client = await getCofheClient(ethersProvider, signer);
      const permit = await client.permits.getOrCreateSelfPermit();
      const isPermitValid = permit.expiration > dayjs().unix();
      if (!isPermitValid) {
        console.warn(
          "Cofhe: Permit is not valid. removing from cache and creating a new one."
        );
        client.permits.removeActivePermit();
        await client.permits.getOrCreateSelfPermit();
      }
      const decryptedAesKey = await client
        .decryptForView(vault.encryptedKeyHandle, FheTypes.Uint128)
        .execute();
      const decryptedIv = await client
        .decryptForView(vault.encryptedIvHandle, FheTypes.Uint128)
        .execute();

      const ciphertextBytes = hexToUint8Array(vault.ciphertext);
      const ivBytes = toBeArray(decryptedIv, 12);
      const aesKeyBytes = bigIntToUint8Array(decryptedAesKey);
      const note = await decryptText(ciphertextBytes, ivBytes, aesKeyBytes);

      setDecryptedNote(note);
    } catch (error) {
      console.error("Decryption failed:", error);
      message.error(
        `Failed to decrypt vault. ${error?.shortMessage || error?.message || "Please try again later."}`
      );
    } finally {
      setLoading((prev) => ({ ...prev, decrypt: false }));
    }
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <Space orientation="vertical" size="small">
        <Alert
          showIcon
          type="info"
          title="Important"
          description={`This message has been released to you as a designated beneficiary. The sender wanted to ensure their important information reaches you safely when they are inactive for so long. The creator last confirmed they were active ${dayjs.unix(vault?.lastActiveAt).fromNow()}.`}
        />

        <Card
          title={`Vault #${vault.idx}`}
          extra={
            <Tag variant="outlined" color={vaultMetadata.color}>
              {vaultMetadata.label}
            </Tag>
          }
        >
          <Space orientation="vertical" size={20} style={{ width: "100%" }}>
            <Descriptions
              column={2}
              layout="vertical"
              colon={false}
              size="small"
              items={[
                {
                  key: "owner",
                  label: "From",
                  children: (
                    <Text copyable={{ text: vault.owner }}>
                      {ellipsisString(vault.owner, 6, 4)}
                    </Text>
                  )
                },
                {
                  key: "lastActiveAt",
                  label: "Last confirmed active",
                  children: formatTimestamp(vault.lastActiveAt)
                },
                {
                  key: "createdAt",
                  label: "Created",
                  children: formatTimestamp(vault.createdAt)
                },
                {
                  key: "releaseAt",
                  label: "Released at",
                  children: formatTimestamp(vault.releaseAt)
                }
              ]}
            />

            <Divider style={{ margin: 0 }} />

            {decryptedNote ? (
              <Input.TextArea
                value={decryptedNote}
                autoSize={{ minRows: 12, maxRows: 15 }}
                variant="outlined"
                readOnly
              />
            ) : (
              <Card
                loading={loading?.decrypt}
                onClick={!loading?.decrypt ? handleDecrypt : undefined}
                styles={{
                  body: {
                    cursor: loading?.decrypt ? "not-allowed" : "pointer",
                    minHeight: "250px",
                    alignItems: "center",
                    backdropFilter: "blur(8px)",
                    justifyContent: "center",
                    display: "flex"
                  }
                }}
              >
                <Space orientation="vertical" size="small" align="center">
                  <LockOutlined
                    style={{ fontSize: "32px", color: "#f5222d" }}
                  />
                  <Title level={5}>Note Encrypted</Title>
                  <Text type="secondary">Click to decrypt</Text>
                </Space>
              </Card>
            )}
          </Space>
        </Card>
        <Paragraph type="secondary">
          * This message was left securely encrypted by{" "}
          {ellipsisString(vault?.owner, 6, 4)}. Only you can decrypt it with
          your wallet. Wanted to keep your messages private and encrypted and
          share them with your loved ones in your absence?
          <Link to="/vaults/create" key="create">
            <Button type="link">
              Create <ArrowRightOutlined />
            </Button>
          </Link>
        </Paragraph>
      </Space>
    </div>
  );
}
