import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const duracaoToast = {
  sucesso: 4000,
  erro: 6000,
  info: 5000,
} as const;

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  showCloseButton: true,
  timerProgressBar: true,
  customClass: {
    popup: "swal-toast",
    title: "swal-toast-titulo",
  },
  didOpen: (popup) => {
    popup.addEventListener("mouseenter", Swal.stopTimer);
    popup.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

function mostrarToast(icone: "success" | "error" | "info", mensagem: string, timer: number) {
  void toast.fire({ icon: icone, title: mensagem, timer });
}

export function toastSucesso(mensagem: string) {
  mostrarToast("success", mensagem, duracaoToast.sucesso);
}

export function toastErro(mensagem: string) {
  mostrarToast("error", mensagem, duracaoToast.erro);
}

export function toastInfo(mensagem: string) {
  mostrarToast("info", mensagem, duracaoToast.info);
}

export async function pedirConfirmacao(opcoes: {
  titulo: string;
  texto?: string;
  confirmar?: string;
  cancelar?: string;
  perigo?: boolean;
}): Promise<boolean> {
  // Valores explícitos: um toast aberto (ou o mixin) não pode vazar `toast`,
  // `timer` ou `showConfirmButton: false` para este diálogo. `heightAuto` e
  // `scrollbarPadding` também brigam com o `overflow-x: hidden` do layout.
  const resultado = await Swal.fire({
    title: opcoes.titulo,
    text: opcoes.texto,
    icon: "warning",
    toast: false,
    timer: undefined,
    timerProgressBar: false,
    position: "center",
    showConfirmButton: true,
    showCancelButton: true,
    showCloseButton: false,
    focusCancel: true,
    reverseButtons: true,
    allowOutsideClick: true,
    returnFocus: false,
    heightAuto: false,
    scrollbarPadding: false,
    confirmButtonText: opcoes.confirmar ?? "Confirmar",
    cancelButtonText: opcoes.cancelar ?? "Cancelar",
    buttonsStyling: false,
    width: "36rem",
    customClass: {
      popup: "swal-dialogo",
      title: "swal-dialogo-titulo",
      htmlContainer: "swal-dialogo-texto",
      actions: "swal-dialogo-acoes",
      confirmButton: opcoes.perigo === false ? "swal-btn-confirmar" : "swal-btn-perigo",
      cancelButton: "swal-btn-cancelar",
      icon: "swal-dialogo-icone",
    },
  });

  return resultado.isConfirmed;
}
