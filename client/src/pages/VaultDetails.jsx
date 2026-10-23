import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { useParams, Link } from "@tanstack/react-router";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider, isAddress, toBeArray } from "ethers";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
  Input,
  Result,
  Row,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Steps,
  Divider,
  Typography,
  App as AntdApp,
  Breadcrumb,
  Spin
} from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  ReloadOutlined,
  SaveOutlined,
  SendOutlined,
  SyncOutlined,
  UsergroupAddOutlined,
  CalendarOutlined,
  UserOutlined
} from "@ant-design/icons";
import {
  bigIntToUint8Array,
  decryptText,
  encryptText,
  getCofheClient,
  hexToUint8Array,
  uint8ArrayToBigInt,
  uint8ArrayToHex,
  ellipsisString,
  afternoteContract,
  subgraphClient
} from "@/utils";
import {
  RELEASE_DELAY_SECONDS,
  GET_VAULT_BY_ID_QUERY,
  SEPOLIA_CHAIN_ID
} from "@/utils/constants";
import { getVaultMetadata } from "@/utils/vaultUtils";

const { Paragraph, Text, Title } = Typography;

function formatTimestamp(timestamp) {
  return dayjs.unix(timestamp).format("MMM D, YYYY h:mm A");
}

export default function VaultDetails() {
  const [vault, setVault] = useState(null);
  const savedVaultRef = useRef(null);
  const [loading, setLoading] = useState({
    read: true,
    ping: false,
    release: false,
    decrypt: false,
    update: false
  });
  const [editing, setEditing] = useState(false);

  const { id } = useParams({ from: "/vaults/$id/" });
  const { address: account, isConnected, caipAddress } = useAppKitAccount();
  // caipAddress format: eip155:<chainid>:<address>
  const selectedChainId = caipAddress?.split(":")[1];
  const { walletProvider } = useAppKitProvider("eip155");
  const { message } = AntdApp.useApp();
  const limits = { beneficiaries: 3 };
  const beneficiaries = vault?.beneficiaries || [];
  const [vaultOwner, vaultIdx] = id.split("-");

  async function handleGetVault() {
    try {
      setLoading((prev) => ({ ...prev, read: true }));
      const data = await subgraphClient.request(GET_VAULT_BY_ID_QUERY, { id });
      setVault(
        data?.vault ? { ...data.vault, content: "", releaseNow: false } : null
      );
    } catch (error) {
      console.error("Failed to fetch vault:", error);
      message.error("Failed to get Vault. Please try again later.");
    } finally {
      setLoading((prev) => ({ ...prev, read: false }));
    }
  }

  useEffect(() => {
    handleGetVault();
  }, [account]);

  if (loading?.read) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  if (!loading?.read && !vault) {
    return (
      <Result
        status="404"
        title="Vault not found"
        subTitle="This vault may be unavailable, or you may not have permission to view it. Please try again in a moment"
        extra={[
          <Link to="/vaults" key="home">
            <Button shape="round" icon={<ArrowLeftOutlined />}>
              Vaults
            </Button>
          </Link>,
          <Button
            type="primary"
            shape="round"
            key="try-again"
            onClick={handleGetVault}
          >
            Try Again
          </Button>
        ]}
      />
    );
  }

  const vaultMetadata = getVaultMetadata(vault);
  const isVaultReleased = Boolean(vault?.isReleased);
  const releaseAt = dayjs.unix(vault?.releaseAt);
  const now = dayjs();
  const canReleaseNow = !isVaultReleased && releaseAt.isBefore(now);
  const isOwner = vaultOwner?.toLowerCase() === account?.toLowerCase();
  const isVaultReadOnly = !isOwner || isVaultReleased;

  function handleAddBeneficiary(input) {
    const value = input.trim();
    if (!isAddress(value)) {
      message.error("Please enter a valid Ethereum address.");
      return;
    }

    if (
      beneficiaries.some((item) => item.toLowerCase() === value.toLowerCase())
    ) {
      message.warning("Beneficiary already added.");
      return;
    }

    if (beneficiaries.length >= limits.beneficiaries) {
      message.warning(`Maximum ${limits.beneficiaries} beneficiaries allowed.`);
      return;
    }

    setVault((prev) => ({
      ...prev,
      beneficiaries: [...prev.beneficiaries, value]
    }));
  }

  function handleRemoveBeneficiary(address) {
    setVault((prev) => {
      const nextBeneficiaries = prev.beneficiaries.filter(
        (item) => item !== address
      );
      return {
        ...prev,
        beneficiaries: nextBeneficiaries,
        releaseNow: nextBeneficiaries.length === 0 ? false : prev.releaseNow
      };
    });
  }

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
      await client.acp.getOrCreateSelfACP();
      // const acp = await client.acp.getOrCreateSelfACP();
      // const isAcpValid = acp.expiration > dayjs().unix();
      // if (!isAcpValid) {
      //   console.warn(
      //     "Cofhe: ACP is not valid. removing from cache and creating a new one."
      //   );
      // client.acp.removeActiveACP();
      //   await client.acp.getOrCreateSelfACP();
      // }
      const decryptedAesKey = await client
        .decryptForView(vault?.encryptedKeyHandle, FheTypes.Uint128)
        .execute();
      const decryptedIv = await client
        .decryptForView(vault?.encryptedIvHandle, FheTypes.Uint128)
        .execute();
      const ciphertextBytes = hexToUint8Array(vault?.ciphertext);
      const ivBytes = toBeArray(decryptedIv, 12);
      const aesKeyBytes = bigIntToUint8Array(decryptedAesKey);
      const note = await decryptText(ciphertextBytes, ivBytes, aesKeyBytes);

      setVault((prev) => ({ ...prev, content: note }));
    } catch (error) {
      console.error("Decryption failed:", error);
      message.error(
        `Failed to decrypt vault. ${error?.shortMessage || error?.message || "Please try again later."}`
      );
    } finally {
      setLoading((prev) => ({ ...prev, decrypt: false }));
    }
  }

  async function handlePing() {
    if (!isConnected || !walletProvider) {
      return message.error("Please connect your wallet first.");
    }
    if (isVaultReadOnly) {
      return message.error("Cannot ping a read-only vault.");
    }

    if (selectedChainId !== SEPOLIA_CHAIN_ID) {
      return message.error("Please switch to Sepolia network.");
    }

    try {
      setLoading((prev) => ({ ...prev, ping: true }));

      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      const tx = await afternoteContract.connect(signer).ping(vaultIdx);
      await tx.wait();

      const now = dayjs().unix();
      setVault((prev) => ({
        ...prev,
        lastActiveAt: now,
        updatedAt: now,
        releaseAt: now + RELEASE_DELAY_SECONDS
      }));
      message.success("Vault pinged successfully.");
    } catch (error) {
      message.error(
        `Failed to ping vault. ${error?.shortMessage || error?.message || "Please try again later."}`
      );
    } finally {
      setLoading((prev) => ({ ...prev, ping: false }));
    }
  }

  async function handleRelease() {
    if (!isConnected || !walletProvider) {
      return message.error("Please connect your wallet first.");
    }

    if (selectedChainId !== SEPOLIA_CHAIN_ID) {
      return message.error("Please switch to Sepolia network.");
    }

    try {
      setLoading((prev) => ({ ...prev, release: true }));

      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      const tx = await afternoteContract
        .connect(signer)
        .release(vaultOwner, vaultIdx);
      await tx.wait();

      const now = dayjs().unix();
      setVault((prev) => ({
        ...prev,
        isReleased: true,
        releaseAt: now
      }));
      message.success("Vault released successfully.");
    } catch (error) {
      console.error("Failed to release vault:", error);
      message.error(
        `Failed to release vault. ${error?.shortMessage || error?.message || "Please try again later."}`
      );
    } finally {
      setLoading((prev) => ({ ...prev, release: false }));
    }
  }

  async function handleSave() {
    if (!vault.content.trim()) {
      return message.error("Please enter the note.");
    }
    if (!isConnected || !walletProvider) {
      return message.error("Please connect your wallet first.");
    }

    if (isVaultReadOnly) {
      return message.error("Cannot update a read-only vault.");
    }

    if (selectedChainId !== SEPOLIA_CHAIN_ID) {
      return message.error("Please switch to Sepolia network.");
    }

    try {
      setLoading((prev) => ({ ...prev, update: true }));

      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      const client = await getCofheClient(ethersProvider, signer);
      const { aesKeyBytes, ivBytes, cipherTextBytes } = await encryptText(
        vault.content
      );

      const aesKeyBigInt = uint8ArrayToBigInt(aesKeyBytes);
      const ivBigInt = uint8ArrayToBigInt(ivBytes);
      const cipherTextHex = uint8ArrayToHex(cipherTextBytes);
      console.log("Note encrypted locally, encrypting keys...");
      const [encryptedKeyInput, encryptedIvInput, signature] = await client
        .encryptInputs([
          Encryptable.uint128(aesKeyBigInt),
          Encryptable.uint128(ivBigInt)
        ])
        .setConsumingContract(afternoteContract.target)
        .execute();
      console.log("Keys encrypted, sending transaction to update vault...");
      const tx = await afternoteContract
        .connect(signer)
        .updateVault(
          vaultIdx,
          encryptedKeyInput,
          encryptedIvInput,
          signature,
          cipherTextHex,
          vault.beneficiaries,
          vault.releaseNow
        );
      await tx.wait();
      const now = dayjs().unix();
      setVault((prev) => ({
        ...prev,
        lastActiveAt: now,
        updatedAt: now,
        releaseAt: vault.releaseNow ? now : now + RELEASE_DELAY_SECONDS,
        isReleased: vault.releaseNow
      }));
      setEditing(false);
      savedVaultRef.current = null;
      message.success("Vault updated successfully.");
    } catch (error) {
      console.error("Failed to update vault:", error);
      message.error(
        `Failed to update vault. ${error?.shortMessage || error?.message || "Please try again later."}`
      );
    } finally {
      setLoading((prev) => ({ ...prev, update: false }));
    }
  }

  return (
    <Space orientation="vertical" size={24} style={{ width: "100%" }}>
      <Breadcrumb
        style={{ marginBottom: 7 }}
        items={[
          { title: <Link to="/">Home</Link> },
          { title: <Link to="/vaults">Vaults</Link> },
          { title: `Vault #${vaultIdx}` }
        ]}
      />
      {isVaultReadOnly && (
        <Alert
          showIcon
          closable
          type={isVaultReleased ? "info" : "warning"}
          title={isVaultReleased ? "Vault Released" : "Restricted Access"}
          description={
            isVaultReleased
              ? "Released notes cannot be modified. They have been granted access to beneficiaries and are now read-only."
              : "Only vault owner can ping, decrypt, and update from this page."
          }
        />
      )}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            variant="outlined"
            extra={
              <Space>
                {editing ? (
                  <>
                    <Button
                      type="primary"
                      shape="round"
                      icon={<SaveOutlined />}
                      loading={loading.update}
                      onClick={handleSave}
                    >
                      Save
                    </Button>
                    <Button
                      shape="round"
                      onClick={() => {
                        setEditing(false);
                        setVault(savedVaultRef.current);
                        savedVaultRef.current = null;
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="text"
                      title="Edit"
                      shape="round"
                      icon={<EditOutlined />}
                      onClick={() => {
                        if (!vault.content) {
                          return message.warning(
                            "Please decrypt the vault before editing."
                          );
                        }
                        savedVaultRef.current = vault;
                        setEditing(true);
                      }}
                      disabled={isVaultReadOnly}
                    />
                    <Button
                      type="text"
                      title="Refresh"
                      shape="round"
                      icon={<ReloadOutlined />}
                      onClick={handleGetVault}
                    />
                  </>
                )}
              </Space>
            }
          >
            {editing ? (
              <>
                <Spin
                  fullscreen
                  spinning={loading.update}
                  description="Saving vault. Please wait..."
                  styles={{ indicator: { color: "#667eea" } }}
                />
                <Input.TextArea
                  rows={16}
                  showCount
                  maxLength={200}
                  value={vault.content}
                  onChange={(event) =>
                    setVault((prev) => ({
                      ...prev,
                      content: event.target.value
                    }))
                  }
                />
                <Text type="secondary">
                  Note will be encrypted locally before being sent on-chain.
                </Text>
              </>
            ) : (
              <Space orientation="vertical" style={{ width: "100%" }}>
                <Title level={3}>Vault #{vaultIdx}</Title>
                <Space
                  wrap
                  separator={
                    <Divider orientation="vertical" style={{ margin: 0 }} />
                  }
                >
                  <Text type="secondary" title="Updated At">
                    <CalendarOutlined /> {formatTimestamp(vault?.createdAt)}
                  </Text>
                  <Text type="secondary" title="Updated At">
                    <EditOutlined /> {formatTimestamp(vault?.lastActiveAt)}
                  </Text>
                  {!isOwner && (
                    <Text
                      type="secondary"
                      title="Owner"
                      copyable={{ text: vaultOwner }}
                    >
                      <UserOutlined /> {ellipsisString(vaultOwner, 6, 4)}
                    </Text>
                  )}
                  <Text type="secondary" title="Beneficiaries">
                    <UsergroupAddOutlined /> {beneficiaries.length}
                  </Text>
                </Space>
                {vault.content ? (
                  <Input.TextArea
                    value={vault.content}
                    autoSize={{ minRows: 12, maxRows: 18 }}
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
                        minHeight: "260px",
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
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space orientation="vertical" size={16} style={{ width: "100%" }}>
            <Card
              title="Beneficiaries"
              size="small"
              extra={`${beneficiaries.length} of ${limits.beneficiaries}`}
            >
              {editing ? (
                <Input.Search
                  size="large"
                  placeholder="0x..."
                  maxLength={42}
                  enterButton="+ Add"
                  allowClear
                  onSearch={handleAddBeneficiary}
                  disabled={beneficiaries.length >= limits.beneficiaries}
                />
              ) : null}

              <div style={{ marginTop: editing ? 16 : 0 }}>
                {beneficiaries.length === 0 ? (
                  <Empty
                    description="No beneficiaries configured for this vault."
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <Space
                    orientation="vertical"
                    size="small"
                    style={{ width: "100%" }}
                  >
                    {beneficiaries.map((address) => (
                      <Alert
                        key={address}
                        type="info"
                        title={
                          <Text type="secondary" copyable={{ text: address }}>
                            {ellipsisString(address, 10, 6)}
                          </Text>
                        }
                        action={
                          editing ? (
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleRemoveBeneficiary(address)}
                            />
                          ) : null
                        }
                      />
                    ))}
                  </Space>
                )}
              </div>
              {editing && (
                <Checkbox
                  style={{ marginTop: 16 }}
                  checked={vault.releaseNow}
                  onChange={(event) =>
                    setVault((prev) => ({
                      ...prev,
                      releaseNow: event.target.checked
                    }))
                  }
                  disabled={beneficiaries.length === 0}
                >
                  Release immediately to beneficiaries
                </Checkbox>
              )}
            </Card>

            <Card
              variant="outlined"
              title="Heartbeat"
              extra={
                <Tag variant="outlined" color={vaultMetadata.color}>
                  {vaultMetadata.label}
                </Tag>
              }
            >
              <Space
                orientation="vertical"
                size="small"
                style={{ width: "100%" }}
              >
                <Statistic.Timer
                  title="Release countdown"
                  type={vault.isReleased ? "countup" : "countdown"}
                  value={dayjs.unix(vault.releaseAt)}
                  format="D[d] H[h] m[m]"
                  suffix={vault.isReleased ? "ago" : "left"}
                  styles={{
                    content: {
                      color: vaultMetadata.color,
                      fontWeight: "bold"
                    }
                  }}
                />
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  {isVaultReleased
                    ? "Beneficiaries can decrypt this vault with the address added as a beneficiary."
                    : `Ping keeps the vault active and resets the 10 day release window.  ${canReleaseNow ? "This vault has also passed its deadline, so anyone can release it now." : ""}`}
                </Paragraph>
                <Space wrap>
                  <Button
                    type="primary"
                    shape="round"
                    icon={<SyncOutlined />}
                    loading={loading.ping}
                    onClick={handlePing}
                    disabled={isVaultReadOnly}
                  >
                    Ping
                  </Button>
                  {canReleaseNow && (
                    <Button
                      shape="round"
                      icon={<SendOutlined />}
                      loading={loading.release}
                      onClick={handleRelease}
                    >
                      Release
                    </Button>
                  )}
                  {isVaultReleased && (
                    <Link to="/vaults/$id/decrypt" params={{ id }}>
                      <Button
                        type={"primary"}
                        shape="round"
                        icon={<ArrowRightOutlined />}
                      >
                        Decrypt
                      </Button>
                    </Link>
                  )}
                </Space>
                <Divider style={{ margin: 0 }}>
                  <Text type="secondary">Timeline</Text>
                </Divider>
                <Steps
                  current={vault.isReleased ? 2 : 1}
                  orientation="vertical"
                  titlePlacement="vertical"
                  size="small"
                  items={[
                    {
                      title: "Note Created",
                      content: formatTimestamp(vault.createdAt)
                    },
                    {
                      title: "Last active",
                      content: formatTimestamp(vault.lastActiveAt)
                    },
                    {
                      title: vault.isReleased ? "Released" : "Release",
                      content: formatTimestamp(vault.releaseAt)
                    }
                  ]}
                />
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
