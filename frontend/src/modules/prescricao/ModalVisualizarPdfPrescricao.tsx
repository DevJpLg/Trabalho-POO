import { useEffect, useState } from "react";
import type { InterfaceHttpClient } from "../../shared/http/HttpClient";
import { getErrorMessage } from "../../shared/http/getErrorMessage";
import { Modal } from "../../shared/ui/Modal";
import { Button } from "../../shared/ui/Button";
import { Alert, LoadingState } from "../../shared/ui/PageHeader";
import { rotuloAnexoPrescricao, rotaArquivoPrescricao } from "./prescricaoAnexo";

type Props = {
  open: boolean;
  prescricaoId: number | null;
  numeroPrescricao: string;
  anexo: string;
  http: InterfaceHttpClient;
  onClose: () => void;
};

export function ModalVisualizarPdfPrescricao({
  open,
  prescricaoId,
  numeroPrescricao,
  anexo,
  http,
  onClose,
}: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!open || prescricaoId == null) {
      setPdfUrl(null);
      setErro(null);
      return;
    }

    let ativo = true;
    let objectUrl: string | null = null;
    setCarregando(true);
    setErro(null);

    http
      .getBlob(rotaArquivoPrescricao(prescricaoId))
      .then((blob) => {
        if (!ativo) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      })
      .catch((err) => {
        if (!ativo) return;
        setErro(getErrorMessage(err));
        setPdfUrl(null);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, prescricaoId, http]);

  return (
    <Modal
      open={open}
      title={`Receita ${numeroPrescricao}`}
      descricao={rotuloAnexoPrescricao(anexo)}
      tamanho="lg"
      onClose={onClose}
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      {carregando ? (
        <LoadingState label="Carregando PDF..." />
      ) : erro ? (
        <Alert tone="error">{erro}</Alert>
      ) : pdfUrl ? (
        <iframe
          title={`PDF ${numeroPrescricao}`}
          src={pdfUrl}
          className="h-[min(70vh,640px)] w-full rounded-xl border border-line bg-white"
        />
      ) : (
        <Alert tone="error">Não foi possível abrir o PDF desta prescrição.</Alert>
      )}
    </Modal>
  );
}
