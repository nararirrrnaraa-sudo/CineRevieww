
function cineReview() {
    return {
        apiKey: "403d40dc628fd07eb9df5e6374a09cb1",

        movies: [],
        searchQuery: "",
        selectedYear: "",
        years: [],
        loading: false,
        loadingMore: false,
        errorMessage: "",
        selectedMovie: null,
        currentPage: 1,
        trailerUrl: "",
        trailerMessage: "",

        async requestTMDB(endpoint, params = {}) {
            if (!this.apiKey || this.apiKey === "GANTI_DENGAN_API_KEY_TMDB") {
                throw new Error(
                    "Masukkan API key TMDB di dalam kode terlebih dahulu."
                );
            }

            const url = new URL(
                `https://api.themoviedb.org/3/${endpoint}`
            );

            url.search = new URLSearchParams({
                api_key: this.apiKey,
                language: "id-ID",
                ...params
            }).toString();

            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "API key TMDB tidak valid. Periksa kembali API key kamu."
                    );
                }

                if (response.status === 429) {
                    throw new Error(
                        "Permintaan terlalu banyak. Tunggu sebentar lalu coba lagi."
                    );
                }

                throw new Error(
                    `TMDB gagal mengambil data. Kode: ${response.status}`
                );
            }

            return await response.json();
        },

        async loadPopularMovies() {
            this.loading = true;
            this.errorMessage = "";
            this.currentPage = 1;
            this.movies = [];

            try {
                const data = await this.requestTMDB(
                    "movie/popular",
                    { page: String(this.currentPage) }
                );

                this.movies = data.results || [];
                this.updateYears();

                if (this.movies.length === 0) {
                    this.errorMessage = "Film populer belum ditemukan.";
                }
            } catch (error) {
                this.errorMessage = error.message;
                console.error("Kesalahan TMDB:", error);
            } finally {
                this.loading = false;
            }
        },

        async loadMoreMovies() {
            if (this.loadingMore) return;

            this.loadingMore = true;
            this.errorMessage = "";

            try {
                const nextPage = this.currentPage + 1;

                const data = await this.requestTMDB(
                    "movie/popular",
                    { page: String(nextPage) }
                );

                this.movies = [
                    ...this.movies,
                    ...(data.results || [])
                ];

                this.currentPage = nextPage;
                this.updateYears();
            } catch (error) {
                this.errorMessage = error.message;
                console.error("Kesalahan TMDB:", error);
            } finally {
                this.loadingMore = false;
            }
        },

        updateYears() {
            const yearSet = new Set(
                this.movies
                    .map(movie => this.getYear(movie.release_date))
                    .filter(year => year !== "-")
            );

            this.years = [...yearSet].sort(
                (a, b) => Number(b) - Number(a)
            );
        },

        get filteredMovies() {
            return this.movies.filter(movie => {
                const title = (movie.title || "").toLowerCase();
                const query = this.searchQuery.toLowerCase();
                const year = this.getYear(movie.release_date);

                const matchesTitle = title.includes(query);
                const matchesYear =
                    !this.selectedYear || year === this.selectedYear;

                return matchesTitle && matchesYear;
            });
        },

        getPoster(path) {
            return path
                ? `https://image.tmdb.org/t/p/w500${path}`
                : "https://placehold.co/500x750/171727/ffffff?text=Poster+Tidak+Tersedia";
        },

        getBackdrop(path) {
            return path
                ? `https://image.tmdb.org/t/p/w1280${path}`
                : "";
        },

        getYear(date) {
            return date ? date.substring(0, 4) : "-";
        },

        formatRating(rating) {
            return Number(rating || 0).toFixed(1);
        },

        showMovie(movie) {
            this.selectedMovie = movie;
            this.trailerUrl = "";
            this.trailerMessage = "";
        },

        async loadTrailer(movieId) {
            this.trailerUrl = "";
            this.trailerMessage = "Mencari trailer...";

            try {
                const data = await this.requestTMDB(
                    `movie/${movieId}/videos`
                );

                const videos = data.results || [];

                const trailer = videos.find(video =>
                    video.site === "YouTube" &&
                    video.type === "Trailer" &&
                    video.official
                ) || videos.find(video =>
                    video.site === "YouTube" &&
                    video.type === "Trailer"
                ) || videos.find(video =>
                    video.site === "YouTube"
                );

                if (trailer) {
                    this.trailerUrl =
                        `https://www.youtube-nocookie.com/embed/${trailer.key}`;

                    this.trailerMessage = "";
                } else {
                    this.trailerMessage =
                        "Trailer tidak tersedia untuk film ini.";
                }
            } catch (error) {
                this.trailerMessage = error.message;
            }
        }
    };
}