<template>
<nav class="navbar navbar-expand-lg justify-content-between navbar-dark bg-dark fixed-top">
  <span class="navbar-brand">
    <router-link :to="this.$root.rootUrl" v-on:click.native="clearSearch">
      <span class="logo"><img src="https://harvard-osgi-course-catalog.herokuapp.com/images/logo.svg" alt="Harvard Extension Badge"></span>
      <div class="branding">
        <span class="school-title">Harvard Extension</span>
        <span class="brand-title">Course Catalog</span>
      </div>
    </router-link>
  </span>

  <div class="collapse navbar-collapse" id="app-navbar-collapse">
    <div class="form-inline">
      <div class="input-group">
        <multiselect v-model="searchTerm" :options="searchTerms" :allow-empty="false" group-label="type" group-values="names" track-by="name" label="name" placeholder="Select a search type"></multiselect>
        <input type="hidden" name="_token" :value="csrf">
        <input v-model="keyword" v-on:keyup="typingSearch" v-on:keydown.enter="searchCourses" name="keyword" type="text" class="form-control search-input" placeholder="search title, subject, or keyword">
        <icon class="fa-lg" :icon="['far', 'search']" />
      </div>
    </div>
  </div>

  <v-popover>
    <button class="btn btn-link favorites" tabindex="0" v-bind:class="{ 'course-favorited': favoritesAmount != 0 }">
      <icon class="fa-lg" :icon="['fas', 'star']" fixed-width /> <span class="favorites-amount">{{ favoritesAmount }}</span>
    </button>

    <template slot="popover">
      <mycourses></mycourses>
    </template>
  </v-popover>


  <a class="home-link" href="https://www.extension.harvard.edu/" target="_blank" v-tooltip="{ content: 'Go to the Extension Homepage' }">
    <icon class="fa-lg" :icon="['fas', 'home']" fixed-width />
  </a>

  <button id="navbar-toggler" v-on:click="showMobileMenu = !showMobileMenu" v-bind:class="{ active: showMobileMenu }" class="navbar-toggler" type="button" data-toggle="collapse" data-target="#app-navbar-collapse" aria-controls="navbarSupportedContent"
    aria-expanded="false" aria-label="Toggle navigation">
    <span class="navbar-toggler-icon"></span>
  </button>
</nav>
</template>

<script>
import { Multiselect } from 'vue-multiselect';
import { searchUtils } from '../searchUtils';
import { mapGetters } from 'vuex'

export default {
  components: {
    Multiselect
  },
  mixins: [searchUtils],
  data() {
    return {
      keyword: this.$route.query.keyword,
      csrf: document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
      searchTerm: this.$store.getters.searchType,
      showMobileMenu: false,
      searchTerms: [{
          type: "All Courses",
          names: [{
            name: "All courses",
            type: "all"
          }]
        },
        {
          type: "Degrees",
          names: [{
            name: "",
            type: "degree"
          }]
        },
        {
          type: "Certificates",
          names: [{
            name: "",
            type: "certificate"
          }]
        }
      ]
    };
  },
  watch: {
    '$route'(to, from) {
      if (!_.isEqual(to.meta, from.meta)) {
        let name = Object.values(to.params);

        //if we're going to a degree or certificate search...
        if (name[0] != undefined) {
          this.searchTerm = {
            name: name[0].replace(/-/g, " "),
            type: to.meta.program
          }
        } else {
          this.searchTerm = {
            name: "All courses",
            type: "all"
          }
        }
      }
    }
  },
  created() {
    this.setSearch();

    this.$store.dispatch("fetchCertificateList", `${this.$root.apiUrl}/api/certificates`).then(() => {
      this.searchTerms[2].names = this.certificates;
    });

    this.$store.dispatch("fetchDegreeList", `${this.$root.apiUrl}/api/degrees`).then(() => {
      this.searchTerms[1].names = this.degrees;
    });

    //add event handlers
    this.$eventBus.$on("filtersCleared", this.resetSearch);
  },
  computed: {
    ...mapGetters({
      certificates: "certificates",
      degrees: "degrees"
    }),
    favoritesAmount() {
      return this.$store.getters.favorites.length;
    },
  },
  methods: {
    typingSearch: _.debounce(function(e) {
      if (e.keyCode != 9)
        this.searchCourses(e);
    }, 500),
    searchCourses(e) {
      const query = this.searchQueryToObject();
      const searchString = e.target.value;
      const c = String.fromCharCode(e.keyCode);
      const isWordCharacter = c.match(/\w/);
      const isModifier = (e.keyCode == 8 || e.keyCode == 46 || e.keyCode == 13);

      let searchTypeURL = `${this.$root.rootUrl}/courses`;

      //Get values of currently selected search terms
      const searchType = this.searchTerm.type;
      const searchName = this.searchTerm.name.replace(/\s+/g, "-");

      if (searchType == "degree" || searchType == "certificate") {
        searchTypeURL = `${this.$root.rootUrl}/courses-by-${searchType}/${searchName}`;
      }

      let isQueryFinished = ((isWordCharacter || isModifier) && searchString.length > 2 && e.keyCode != 16 && e.keyCode != 9) || searchString.length == 0;

      if (isQueryFinished) {
        if (this.hasSearchQuery) {
          this.$root.$router.push({
            path: searchTypeURL,
            query: Object.assign({}, query, {
              keyword: this.keyword
            })
          });
        } else {
          this.$root.$router.push({
            path: searchTypeURL,
            query: {
              keyword: this.keyword
            }
          });
        }
      }
    },
    setSearch() {
      //if we are arriving on a degree or certificate search directly...
      if (this.$route.meta.program === "degree" || this.$route.meta.program === "certificate") {
        let name = Object.values(this.$route.params);

        let selectedSearchType = {
          name: name[0].replace(/-/g, ' '),
          type: typeCheck[0]
        }

        this.$store.dispatch("setSearchType", selectedSearchType);
      }
    },
    clearSearch() {
      this.keyword = "";
      this.$store.dispatch("clearSelectedFilters");
    },
    resetSearch() {
      this.clearSearch();

      this.$root.$router.push({
        path: window.location.pathname
      });
    }
  }
}
</script>
