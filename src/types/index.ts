export interface Contact {
  id?: string
  naam: string
  email: string
  telefoon?: string
  bedrijf?: string
  functie?: string
  categorie: 'klant' | 'netwerk' | 'leverancier' | 'overig'
  tags?: string[]
  website?: string
  branche?: string
  regio?: string
  notitie?: string
  aangemaaktOp: number
  bijgewerktOp: number
}

export interface Organization {
  id?: string
  naam: string
  type?: string
  sector?: string
  website?: string
  regio?: string
  contactpersoon?: string
  email?: string
  telefoon?: string
  beschrijving?: string
  aangemaaktOp: number
  bijgewerktOp: number
}

export interface Client {
  id?: string
  naam: string
  type?: string
  contactpersoon?: string
  email?: string
  telefoon?: string
  website?: string
  sector?: string
  status: 'actief' | 'inactief' | 'prospect'
  notitie?: string
  aangemaaktOp: number
  bijgewerktOp: number
}

export interface Project {
  id?: string
  naam: string
  omschrijving?: string
  status: 'concept' | 'actief' | 'on-hold' | 'afgerond' | 'geannuleerd'
  opdrachtgeverId?: string
  opdrachtgeverNaam?: string
  teamleden?: string[]   // array of user emails
  startdatum?: string
  einddatum?: string
  locatie?: string
  budget?: string
  aangemaaktOp: number
  bijgewerktOp: number
}

export interface Task {
  id?: string
  titel: string
  omschrijving?: string
  status: 'open' | 'inprogress' | 'done'
  prioriteit: 'laag' | 'normaal' | 'hoog'
  deadline?: string
  toegewezenAan?: string       // display name
  toegewezenAanEmail?: string  // email for personal task filtering
  projectId?: string
  projectNaam?: string
  contactId?: string
  contactNaam?: string
  aangemaaktOp: number
  bijgewerktOp: number
}

export interface Note {
  id?: string
  tekst: string
  contactId?: string
  contactNaam?: string
  projectId?: string
  projectNaam?: string
  auteur: string
  auteurEmail?: string
  aangemaaktOp: number
}

export interface Interaction {
  id?: string
  contactId: string
  contactNaam?: string
  type: 'call' | 'email' | 'meeting' | 'overig'
  datum: string
  notitie?: string
  auteur: string
  aangemaaktOp: number
}

export interface UserProfile {
  uid: string
  naam: string
  email: string
  fotoUrl?: string
  rol: 'admin' | 'member'
  aangemaaktOp: number
}
