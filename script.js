const form = document.querySelector("form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submit-btn");
const errorMessage = document.getElementById("error-message");

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const username = usernameInput.value;
  const password = passwordInput.value;

  // reset error message tiap submit baru
  errorMessage.textContent = "";

  // ganti state tombol jadi loading
  submitBtn.textContent = "Memproses...";
  submitBtn.disabled = true;

  try {
    const response = await fetch("https://dummyjson.com/users");
    const data = await response.json();
    const users = data.users;

    // pake filter() buat cari user yang cocok
    const matchedUser = users.filter(
      (user) => user.username === username && user.password === password
    )[0];

    if (matchedUser) {
      // nyimpen firstName ke Local Storage
      localStorage.setItem("firstName", matchedUser.firstName);

      usernameInput.value = "";
      passwordInput.value = "";

      // redirect otomatis ke halaman katalog
      window.location.href = "catalog.html";
    } else {
      // username/password salah
      errorMessage.textContent = "Username atau password salah!";
      submitBtn.textContent = "Masuk";
      submitBtn.disabled = false;
    }
  } catch (error) {
    // menangani error koneksi/server 
    errorMessage.textContent = "Gagal terhubung ke server, silakan coba lagi";
    console.error("Login error:", error);
    submitBtn.textContent = "Masuk";
    submitBtn.disabled = false;
  }
});