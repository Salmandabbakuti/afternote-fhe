import { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider } from "ethers";
import {
  Button,
  Card,
  Space,
  Table,
  Tag,
  Typography,
  Breadcrumb,
  Empty,
  App as AntdApp
} from "antd";
import { PlusOutlined, SyncOutlined } from "@ant-design/icons";
import { afternoteContract, ellipsisString } from "@/utils";
import { getVaultMetadata } from "@/utils";
import { RELEASE_DELAY_SECONDS } from "@/utils/constants";

const { Text } = Typography;

dayjs.extend(relativeTime);

function formatTimestamp(timestamp) {
  return dayjs.unix(timestamp).format("MMM D, YYYY h:mm A");
}

export default function Vaults() {
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { address: account, isConnected } = useAppKitAccount();
  const { message } = AntdApp.useApp();
  const { walletProvider } = useAppKitProvider("eip155");

  async function getVaults() {
    if (!account) {
      setVaults([]);
      return;
    }

    setLoading(true);

    try {
      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      console.log(
        "Fetching vaults for account:",
        account,
        await signer.getAddress()
      );
      const vaultsRes = await afternoteContract.connect(signer).getVaults();

      const vaults = vaultsRes?.length > 0 ? vaultsRes : [];
      setVaults(vaults);
    } catch (error) {
      console.error("Error loading vaults:", error);
      message.error("Failed to load vaults. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getVaults();
  }, [account]);

  const columns = [
    {
      title: "ID",
      key: "idx",
      // sorter: (a, b) => a.idx - b.idx,
      render: (_, __, idx) => <Text strong>{`Vault #${idx}`}</Text>
    },
    {
      title: "Status",
      key: "status",
      render: (vault) => {
        const vaultMetadata = getVaultMetadata(vault);

        return (
          <Tag variant="outlined" color={vaultMetadata.color}>
            {vaultMetadata.label}
          </Tag>
        );
      }
    },
    {
      title: "Beneficiaries",
      dataIndex: "beneficiaries",
      key: "beneficiaries",
      render: (beneficiaries) => (
        <Space orientation="vertical" size="small">
          {beneficiaries?.length > 0
            ? beneficiaries.map((address) => (
                <Text key={address} ellipsis copyable={{ text: address }}>
                  {ellipsisString(address, 6, 4)}
                </Text>
              ))
            : "None"}
        </Space>
      )
    },
    {
      title: "Last Active",
      dataIndex: "lastActiveAt",
      key: "lastActiveAt",
      // sorter: (a, b) => a.lastActiveAt - b.lastActiveAt,
      render: (lastActiveAt) => {
        const lastActiveAtNumber = Number(lastActiveAt);
        return (
          <Space orientation="vertical" size={0}>
            <Text>{formatTimestamp(lastActiveAtNumber)}</Text>
            <Text type="secondary">
              {dayjs.unix(lastActiveAtNumber).fromNow()}
            </Text>
          </Space>
        );
      }
    },
    {
      title: "Release At",
      key: "releaseAt",
      // sorter: (a, b) => a.releaseAt - b.releaseAt,
      render: (vault) => {
        const releaseAt = Number(vault?.lastActiveAt) + RELEASE_DELAY_SECONDS;

        return (
          <Space orientation="vertical" size={0}>
            <Text>{formatTimestamp(releaseAt)}</Text>
            <Text type="secondary">
              {vault?.beneficiaries.length === 0
                ? "No beneficiaries configured"
                : dayjs.unix(releaseAt).fromNow()}
            </Text>
          </Space>
        );
      }
    }
  ];

  return (
    <Space orientation="vertical" size={24} style={{ width: "100%" }}>
      <Breadcrumb
        style={{ marginBottom: 7 }}
        items={[{ title: <Link to="/">Home</Link> }, { title: "Vaults" }]}
      />
      <Card
        variant="borderless"
        title="Your Vaults"
        extra={
          <Space wrap>
            <Button
              title="Create Vault"
              shape="round"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate({ to: "/vaults/create" })}
            >
              Vault
            </Button>
            <Button
              type="text"
              title="Refresh"
              shape="circle"
              icon={<SyncOutlined spin={loading} />}
              onClick={getVaults}
            />
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={vaults}
          columns={columns}
          scroll={{ x: "max-content" }}
          pagination={{
            responsive: true,
            hideOnSinglePage: true,
            showLessItems: true,
            pageSizeOptions: [5, 10, 25, 50, 100],
            showSizeChanger: true,
            defaultPageSize: 10,
            simple: true
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  isConnected
                    ? "No vaults match the selected filter yet. Try expanding your filter or create a new vault to get started."
                    : "Please connect your wallet to manage your vaults."
                }
              />
            )
          }}
          onRow={(_, idx) => ({
            onClick: () => {
              const vaultId = `${account?.toLowerCase()}-${idx}`;
              navigate({
                to: "/vaults/$id",
                params: { id: vaultId }
              });
            },
            style: { cursor: "pointer" }
          })}
        />
      </Card>
    </Space>
  );
}
