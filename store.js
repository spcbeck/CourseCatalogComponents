import Vue from "vue"
import Vuex from "vuex"

Vue.use(Vuex);

const state = {
  loading: false,
  courses: [],
  filters: [],
  degrees: [{
    name: "",
    type: ""
  }],
  certificates: [{
    name: "",
    type: ""
  }],
  favorites: [],
  currentSearchType: {
    name: "All courses",
    type: "all"
  }
};

const mutations = {
  toggleLoading(state) {
    state.loading = !state.loading;
  },
  setCourses(state, courses) {
    state.courses = courses;
  },
  setFilters(state, filters) {
    state.filters = filters;
  },
  setCertificates(state, certificates) {
    state.certificates = _.map(certificates, e => {
      let search = {};

      search.name = e.title;

      search["type"] = "certificate";

      return search;
    });
  },
  setDegrees(state, degrees) {
    state.degrees = _.map(degrees, e => {
      let search = {};

      search.name = e.title;

      search["type"] = "degree";

      return search;
    });
  },
  clearSelectedFilters(state) {
    _.forEach(state.filters, filter => {
      if (filter.selected_options !== undefined) {
        filter.selected_options = null;
      }
    })
  },
  addFavorite(state, favorite) {
    /* Add a favorited course to the store and to cookies */
    let favoriteCookieFormat = {};
    favoriteCookieFormat[favorite.crn] = favorite.title;
    state.favorites.push(favoriteCookieFormat);

    let favoriteString = JSON.stringify(favorite);

    Vue.cookies.set(favorite.crn, favorite.title, "1y", "/");
  },
  removeFavorite(state, crn) {
    /* Remove a favorite from the store and from the cookies */
    let favorites = _.remove(state.favorites, item => {
      Object.keys(item)[0] != crn;
    });

    state.favorites = [];
    state.favorites = favorites;

    Vue.cookies.remove(crn);
  },
  getFavorites(state) {
    /* Get courses that are stored in the cookies */
    let keys = Vue.cookies.keys();
    keys.forEach(key => {
      if (/^(?=(\D*\d){5}\D*$)/.test(key)) {
        let favorite = {};
        favorite[key] = Vue.cookies.get(key);
        state.favorites.push(favorite);
      }
    });
  },
  setSearchType(state, search) {
    Vue.set(state.currentSearchType, 0, search);
  }
};

const actions = {
  toggleLoading({ commit }) {
    commit("toggleLoading");
  },
  fetchCourses({ commit }, url) {
    return axios.get(url[0], {
      params: url[1]
    }).then((res) => {
      commit("setCourses", res.data.courses);
    }, (err) => {
      console.log("Error fetching courses");
      //Should we set courses and filters to some default value if we get an error?
    });
  },
  setCourses({ commit }, courses) {
    commit("setCourses", courses);
  },
  fetchFilters({ commit }, url) {
    return axios.get(url).then((res) => {
      commit("setFilters", res.data.aggregations);
    }), (err) => {
      console.error("Error fetching filters");
    }
  },
  setFilters({ commit }, filters) {
    commit("setFilters", filters);
  },
  fetchCertificateList({ commit }, url) {
    return axios.get(url).then((res) => {
      commit("setCertificates", res.data);
    }, (err) => {
      console.error("Error fetching certificates");
    });
  },
  fetchDegreeList({ commit }, url) {
    return axios.get(url).then((res) => {
      commit("setDegrees", res.data);
    }, (err) => {
      console.error("Error fetching degrees");
    });
  },
  clearSelectedFilters({ commit }) {
    commit("clearSelectedFilters");
  },
  addFavorite({ commit }, course) {
    commit("addFavorite", course);
  },
  removeFavorite({ commit }, crn) {
    commit("removeFavorite", crn);
  },
  getCookieFavorites({ commit }) {
    commit("getFavorites");
  },
  setSearchType({ commit }, search) {
    commit("setSearchType", search);
  }
};

const getters = {
  isLoading: state => {
    return state.loading;
  },
  getCourses: state => {
    return state.courses;
  },
  getFilters: state => {
    return state.filters;
  },
  favorites: state => {
    return state.favorites;
  },
  certificates: state => {
    return state.certificates;
  },
  degrees: state => {
    return state.degrees;
  },
  searchType: state => {
    return state.currentSearchType;
  }
};

export default new Vuex.Store({
  state: state,
  mutations: mutations,
  actions: actions,
  getters: getters
});
