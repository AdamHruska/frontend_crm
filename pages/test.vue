<template>
	<div class="add-person-form">
		<h2 class="text-xl font-semibold mb-4">Add New Person</h2>
		<form @submit.prevent="handleSubmit">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="meno" class="block">Meno</label>
					<input id="meno" type="text" class="input-field" />
				</div>
				<div>
					<label for="priezvisko" class="block">Priezvisko</label>
					<input id="priezvisko" type="text" class="input-field" />
				</div>
				<div>
					<label for="poradca" class="block">Poradca</label>
					<input id="poradca" type="text" class="input-field" />
				</div>
				<div>
					<label for="cislo" class="block">Tel. číslo</label>
					<input id="cislo" type="text" class="input-field" />
				</div>
				<div>
					<label for="email" class="block">Email</label>
					<input id="email" type="email" class="input-field" />
				</div>
				<div>
					<label for="odporucitel" class="block">Odporucitel</label>
					<input id="odporucitel" type="text" class="input-field" />
				</div>
				<div>
					<label for="datum_pridania" class="block">Dátum pridania</label>
					<input id="datum_pridania" type="date" class="input-field" />
				</div>
				<div>
					<label for="adresa" class="block">Adresa</label>
					<input id="adresa" type="text" class="input-field" />
				</div>
				<div>
					<label for="vek" class="block">Vek (rok narodenia)</label>
					<input id="vek" type="number" class="input-field" />
				</div>
				<div>
					<label for="zamestanie" class="block">Zamestnanie</label>
					<input id="zamestanie" type="text" class="input-field" />
				</div>
				<div>
					<label for="poznamka" class="block">Poznámka</label>
					<input id="poznamka" type="text" class="input-field" />
				</div>
				<div>
					<label for="Investicny_dotaznik" class="block"
						>Investicny dotazník vyplenený</label
					>
					<input id="Investicny_dotaznik" type="date" class="input-field" />
				</div>
			</div>
			<div class="mt-4 flex justify-end">
				<button
					type="button"
					class="mr-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
				>
					Cancel
				</button>
				<button
					type="submit"
					class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
				>
					Add Person
				</button>
			</div>
		</form>
	</div>
</template>
